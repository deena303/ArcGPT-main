import crypto from 'crypto';
import { checkOllamaStatus, generateStructuredAiResponse } from './ai.js';
import { schemaService } from './schema.service.js';
import { sqlValidationService } from './sql-validation.service.js';
import { databaseService } from './database.service.js';
import { visualizationService } from './visualization.service.js';
import { auditService } from './audit.service.js';
import { QueryExecutionResult, PipelineStep, ConversationContextItem, User } from '../types/index.js';

const AI_UNAVAILABLE_MESSAGE = 'Local AI engine is unavailable. Please start Ollama.';

function safeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'PostgreSQL could not execute the query.';
  if (/timeout|statement timeout|canceling statement/i.test(error.message)) return 'PostgreSQL query exceeded the configured timeout.';
  if (/does not exist|relation .* does not exist|column .* does not exist/i.test(error.message)) return 'The local PostgreSQL schema is not initialized for this query.';
  if (/permission denied|insufficient privilege/i.test(error.message)) return 'The local read-only database role cannot access this data.';
  return 'PostgreSQL could not execute the query.';
}

function baseResult(
  queryId: string,
  naturalLanguageQuery: string,
  pipelineSteps: PipelineStep[],
  status: QueryExecutionResult['status'],
  resultStatus: QueryExecutionResult['resultStatus'],
  message: string,
  explanation: string,
  startTime: number
): QueryExecutionResult {
  return {
    queryId,
    naturalLanguageQuery,
    columns: [],
    rows: [],
    rowCount: 0,
    naturalLanguageAnswer: message,
    queryExplanation: explanation,
    status,
    resultStatus,
    executionTimeMs: Date.now() - startTime,
    pipelineSteps,
    createdAt: new Date().toISOString(),
  };
}

export class SqlGenerationService {
  public checkAmbiguity(query: string): { isAmbiguous: boolean; question?: string; suggestions?: string[] } {
    const q = query.trim().toLowerCase();
    if ((q.includes('low attendance') || q.includes('poor attendance') || q.includes('less attendance') || q.includes('bad attendance')) && !/\d+%?/.test(q)) {
      return {
        isAmbiguous: true,
        question: 'What attendance threshold should I use?',
        suggestions: ['Below 75%', 'Below 70%', 'Below 65%', 'Custom'],
      };
    }
    if ((q === 'show students with good cgpa' || q === 'high cgpa' || q === 'who has good marks' || q === 'students with low marks') && !/\d+/.test(q)) {
      return {
        isAmbiguous: true,
        question: 'Could you specify the target cutoff? (e.g. CGPA above 8.5 or marks below 40)',
        suggestions: ['Show students with CGPA above 8.5', 'Show students who scored below 40 in Data Structures', 'What is the average CGPA of each department?'],
      };
    }
    if (q === 'show fees' || q === 'fee details') {
      return {
        isAmbiguous: true,
        question: 'Would you like to see overdue fees, pending payments, or total collected fees?',
        suggestions: ['Show students with overdue fee status', 'What is the total amount of pending fees?'],
      };
    }
    return { isAmbiguous: false };
  }

  public async processQuery(
    naturalLanguageQuery: string,
    user: User,
    conversationHistory: ConversationContextItem[] = [],
    conversationId?: string
  ): Promise<QueryExecutionResult> {
    const queryId = crypto.randomUUID();
    const startTime = Date.now();
    const pipelineSteps: PipelineStep[] = [
      { step: 1, name: 'Understanding Question', description: 'Parsing user intent and semantic parameters', status: 'pending' },
      { step: 2, name: 'Identifying Relevant Data', description: 'Checking entity boundaries and role constraints', status: 'pending' },
      { step: 3, name: 'Retrieving Schema', description: 'Extracting targeted relational tables and relationships', status: 'pending' },
      { step: 4, name: 'Generating SQL', description: 'Translating natural language into PostgreSQL', status: 'pending' },
      { step: 5, name: 'Validating Query', description: 'Verifying syntax, security rules, and read-only constraints', status: 'pending' },
      { step: 6, name: 'Executing Database Query', description: 'Running sanitized query through the local read-only pool', status: 'pending' },
      { step: 7, name: 'Preparing Answer', description: 'Synthesizing explanation and visualization from real rows', status: 'pending' },
    ];
    const markStep = (step: number, status: PipelineStep['status'], details?: string) => {
      const item = pipelineSteps.find(entry => entry.step === step);
      if (item) {
        item.status = status;
        if (details) item.details = details;
      }
    };
    const persist = async (record: Parameters<typeof databaseService.insertAiQuery>[0]) => {
      try {
        return await databaseService.insertAiQuery(record);
      } catch (error) {
        console.error('[Query logging] unavailable:', error instanceof Error ? error.message : 'unknown error');
        return '';
      }
    };

    markStep(1, 'in_progress');
    const ambiguity = this.checkAmbiguity(naturalLanguageQuery);
    if (ambiguity.isAmbiguous) {
      markStep(1, 'completed', 'Clarification required');
      await auditService.logEvent({ requestId: queryId, userId: user.id, action: 'AMBIGUITY_DETECTED', query: naturalLanguageQuery, status: 'AMBIGUOUS', durationMs: Date.now() - startTime });
      return {
        ...baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'clarification_needed', 'BLOCKED', ambiguity.question || 'Please provide more details.', 'The query was paused because a required parameter was missing.', startTime),
        clarificationRequired: true,
        clarificationQuestion: ambiguity.question,
        clarificationSuggestions: ambiguity.suggestions,
      };
    }
    markStep(1, 'completed');

    if (/^(who|what) are you\b|introduce yourself/i.test(naturalLanguageQuery.trim())) {
      markStep(2, 'completed', 'Informational request is not an institution data query');
      await persist({
        query_id: queryId,
        user_id: user.id,
        natural_language_query: naturalLanguageQuery,
        query_status: 'FAILED',
        execution_time_ms: Date.now() - startTime,
        validation_status: 'NOT_APPLICABLE',
        error_message: 'Informational identity question is outside the database query path.',
      });
      return baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'failed', 'ERROR', 'ArcGPT translates questions about the local institution database.', 'This request was not executed against PostgreSQL.', startTime);
    }

    markStep(2, 'in_progress');
    const normalized = naturalLanguageQuery.toLowerCase();
    const destructive = /\b(delete|drop|alter|truncate|insert|update|create|grant|revoke|merge)\b/.test(normalized);
    const financial = /\b(fee|tuition|payment|salary)\b/.test(normalized);
    if (destructive) {
      markStep(2, 'blocked', 'Destructive operation is not permitted');
      markStep(5, 'blocked');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'blocked', 'BLOCKED', 'This request is not permitted.', 'ArcGPT accepts read-only natural-language data questions only.', startTime);
      await this.recordBlocked(queryId, user, naturalLanguageQuery, result.executionTimeMs, 'Destructive operation detected', 'DESTRUCTIVE_DML_ATTEMPT');
      return { ...result, blockedReason: 'Destructive operation detected.' };
    }
    if (financial && ['FACULTY', 'STUDENT'].includes(user.role.toUpperCase())) {
      markStep(2, 'blocked', 'Role is not authorized for financial data');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'unauthorized', 'UNAUTHORIZED', 'You do not have permission to query this data.', 'The backend role policy denied this request.', startTime);
      await this.recordBlocked(queryId, user, naturalLanguageQuery, result.executionTimeMs, 'Role is not authorized for financial data', 'RBAC_VIOLATION_ATTEMPT');
      return { ...result, blockedReason: 'Your role is not authorized for financial data.' };
    }

    if (user.role.toUpperCase() === 'HOD') {
      const hodDept = (user.departmentCode || '').toUpperCase().trim();
      const allDepts = ['AIML', 'CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
      const otherDepts = allDepts.filter(d => d !== hodDept);
      const targetsOtherDept = otherDepts.some(d => new RegExp(`\\b${d}\\b`, 'i').test(naturalLanguageQuery));
      if (targetsOtherDept) {
        markStep(2, 'blocked', `HOD cannot query data outside assigned department (${hodDept || 'assigned'})`);
        const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'blocked', 'BLOCKED', 'This request is not permitted.', `REQUEST_BLOCKED: As the HOD of ${hodDept || 'your assigned department'}, you are not authorized to query data for other departments.`, startTime);
        await this.recordBlocked(queryId, user, naturalLanguageQuery, result.executionTimeMs, 'Cross-department query attempt blocked', 'HOD_DEPARTMENT_VIOLATION_ATTEMPT');
        return { ...result, blockedReason: `REQUEST_BLOCKED: HOD cannot query other departments.` };
      }
    }

    markStep(2, 'completed');

    markStep(3, 'in_progress');
    const relevantSchema = schemaService.getRelevantSchemaPrompt(naturalLanguageQuery);
    markStep(3, 'completed');

    markStep(4, 'in_progress');
    const ollama = await checkOllamaStatus();
    if (!ollama.available) {
      markStep(4, 'failed', 'Ollama is offline or the configured model is not installed');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'failed', 'ERROR', AI_UNAVAILABLE_MESSAGE, 'No SQL was generated and PostgreSQL was not queried.', startTime);
      await persist({ query_id: queryId, user_id: user.id, natural_language_query: naturalLanguageQuery, query_status: 'FAILED', execution_time_ms: result.executionTimeMs, validation_status: 'NOT_RUN', error_message: AI_UNAVAILABLE_MESSAGE });
      return result;
    }

    const context = conversationHistory.slice(-6).map(item => `${item.role.toUpperCase()}: ${item.content}${item.sql ? ` [prior SQL: ${item.sql}]` : ''}`).join('\n');
    const hodInstruction = user.role.toUpperCase() === 'HOD' ? `\nCRITICAL HOD RESTRICTION: The user is the Head of Department (HOD) for '${user.departmentCode || 'AIML'}'. You MUST enforce department_code = '${user.departmentCode || 'AIML'}' on all queries. Never return records for any other department.` : '';
    const systemPrompt = `You are ArcGPT's local SQL generation engine. Return one JSON object with exactly intent, tables, and sql.
The sql value must be one PostgreSQL read-only SELECT or WITH ... SELECT statement.
Never return DDL, DML, multiple statements, comments, system catalogs, credentials, or arbitrary SQL.
Use ONLY tables and columns supplied below.
Guidelines:
1. For attendance, prefer using the student_attendance_percentage view directly (it already has student_id, register_number, first_name, last_name, department_code, department_name, attendance_percentage, etc.). Department codes are 'AIML', 'CSE', 'ECE', 'MECH', 'CIVIL', 'IT'. Always use department_code (e.g. department_code = 'AIML').
2. When querying average CGPA per department, JOIN departments d JOIN students s ON d.department_id = s.department_id JOIN student_academic_summary sas ON s.student_id = sas.student_id.
3. When querying active backlogs, you can query student_academic_summary sas JOIN students s ON sas.student_id = s.student_id WHERE sas.backlog_count > 1 (or query backlogs where status = 'ACTIVE').
4. When querying faculty teaching a subject, JOIN faculty f JOIN course_offerings co ON f.faculty_id = co.faculty_id JOIN subjects sub ON co.subject_id = sub.subject_id.
5. When querying unsubmitted assignments, select from students where student_id not in (select student_id from submissions sub join assignments a on sub.assignment_id = a.assignment_id where a.title ilike '%Assignment 1%').
Do not invent tables or columns. Role: ${user.role}.${hodInstruction}`;
    const userPrompt = `Relevant PostgreSQL schema:\n${relevantSchema}\n\nConversation context:\n${context || 'None'}\n\nQuestion: ${naturalLanguageQuery}\n\nReturn JSON with intent, tables, and sql.`;
    let generated: Awaited<ReturnType<typeof generateStructuredAiResponse>> = null;
    try {
      generated = await generateStructuredAiResponse({ systemPrompt, userPrompt, temperature: 0.1 });
    } catch (error) {
      markStep(4, 'failed', 'Ollama request failed');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'failed', 'ERROR', AI_UNAVAILABLE_MESSAGE, 'The local model could not return a valid structured response.', startTime);
      await persist({ query_id: queryId, user_id: user.id, natural_language_query: naturalLanguageQuery, query_status: 'FAILED', execution_time_ms: result.executionTimeMs, validation_status: 'NOT_RUN', error_message: 'Ollama request failed.' });
      return result;
    }
    if (!generated) {
      markStep(4, 'failed', 'Ollama returned malformed structured output');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'failed', 'ERROR', 'The local AI returned an invalid query response. Please try again.', 'Malformed model output was rejected before database access.', startTime);
      await persist({ query_id: queryId, user_id: user.id, natural_language_query: naturalLanguageQuery, query_status: 'FAILED', execution_time_ms: result.executionTimeMs, validation_status: 'NOT_RUN', error_message: 'Malformed structured model output.' });
      return result;
    }
    markStep(4, 'completed', `Generated ${generated.intent}`);

    markStep(5, 'in_progress');
    const validation = sqlValidationService.validate(generated.sql, user);
    if (!validation.isValid || !validation.sanitizedSql) {
      markStep(5, 'blocked', validation.blockedReason);
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'blocked', 'BLOCKED', 'This request is not permitted.', validation.blockedReason || 'The generated query did not pass validation.', startTime);
      await this.recordBlocked(queryId, user, naturalLanguageQuery, result.executionTimeMs, validation.blockedReason || 'SQL validation blocked the request.', 'SQL_VALIDATION_BLOCKED', generated.sql);
      return { ...result, generatedSql: generated.sql, blockedReason: validation.blockedReason };
    }
    markStep(5, 'completed', 'Read-only validation passed');

    markStep(6, 'in_progress');
    let dbResult;
    try {
      dbResult = await databaseService.executeSql(validation.sanitizedSql);
    } catch (error) {
      markStep(6, 'failed', 'PostgreSQL execution failed');
      const result = baseResult(queryId, naturalLanguageQuery, pipelineSteps, 'failed', 'ERROR', safeErrorMessage(error), 'The validated query could not be executed by the local PostgreSQL service.', startTime);
      await persist({ query_id: queryId, user_id: user.id, natural_language_query: naturalLanguageQuery, generated_sql: validation.sanitizedSql, query_status: 'FAILED', execution_time_ms: result.executionTimeMs, validation_status: 'VALIDATED', validation_message: 'Read-only validation passed', tables_used: validation.detectedTables, error_message: safeErrorMessage(error) });
      return { ...result, generatedSql: generated.sql, sanitizedSql: validation.sanitizedSql };
    }
    markStep(6, 'completed', `Retrieved ${dbResult.rowCount} rows`);

    markStep(7, 'in_progress');
    const visualization = visualizationService.analyzeAndRecommendChart(dbResult.columns, dbResult.rows as Record<string, any>[], naturalLanguageQuery);
    const explanation = this.buildExplanation(dbResult.columns, dbResult.rows, naturalLanguageQuery);
    markStep(7, 'completed');
    const status = dbResult.resultStatus === 'EMPTY' ? 'empty' : 'success';
    const resultStatus = dbResult.resultStatus;
    const result: QueryExecutionResult = {
      queryId,
      naturalLanguageQuery,
      intent: generated.intent,
      generatedSql: generated.sql,
      sanitizedSql: validation.sanitizedSql,
      columns: dbResult.columns,
      rows: dbResult.rows,
      rowCount: dbResult.rowCount,
      naturalLanguageAnswer: explanation,
      queryExplanation: explanation,
      visualization,
      status,
      resultStatus,
      executionTimeMs: Date.now() - startTime,
      pipelineSteps,
      createdAt: new Date().toISOString(),
    };
    await persist({
      query_id: queryId,
      user_id: user.id,
      natural_language_query: naturalLanguageQuery,
      generated_sql: validation.sanitizedSql,
      query_status: 'SUCCESS',
      result_count: dbResult.rowCount,
      execution_time_ms: result.executionTimeMs,
      validation_status: 'VALIDATED',
      validation_message: 'Safe read-only execution passed',
      tables_used: validation.detectedTables,
    });

    if (conversationId) {
      try {
        const activeConversation = await databaseService.ensureConversation(user.id, conversationId, naturalLanguageQuery);
        await databaseService.appendConversationMessage(activeConversation, 'user', naturalLanguageQuery, queryId);
        await databaseService.appendConversationMessage(activeConversation, 'assistant', result.naturalLanguageAnswer, queryId);
        result.conversationId = activeConversation;
      } catch (error) {
        console.error('[Conversation] persistence failed:', error instanceof Error ? error.message : 'unknown error');
      }
    }

    return result;
  }

  private async recordBlocked(
    queryId: string,
    user: User,
    naturalQuery: string,
    durationMs: number,
    reason: string,
    eventType: string,
    sql = ''
  ): Promise<void> {
    try {
      await databaseService.insertAiQuery({
        query_id: queryId,
        user_id: user.id,
        natural_language_query: naturalQuery,
        generated_sql: sql || null,
        query_status: 'BLOCKED',
        execution_time_ms: durationMs,
        validation_status: 'BLOCKED',
        validation_message: reason,
        error_message: reason,
      });
    } catch (error) {
      console.error('[Query logging] unavailable:', error instanceof Error ? error.message : 'unknown error');
    }
    try {
      await databaseService.insertSecurityEvent({ user_id: user.id, query_id: queryId, event_type: eventType, severity: 'HIGH', description: reason, blocked: true });
    } catch (error) {
      console.error('[Security logging] unavailable:', error instanceof Error ? error.message : 'unknown error');
    }
  }

  private buildExplanation(columns: string[], rows: Record<string, unknown>[], question: string): string {
    if (rows.length === 0) return `The local PostgreSQL query completed successfully and returned no matching records for: ${question}`;
    const first = rows[0];
    const values = columns.slice(0, 3).map(column => `${column}=${String(first[column] ?? '')}`).join(', ');
    return `The local PostgreSQL query returned ${rows.length} row${rows.length === 1 ? '' : 's'}. First row: ${values}.`;
  }
}

export const sqlGenerationService = new SqlGenerationService();
