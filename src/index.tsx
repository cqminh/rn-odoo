/**
 * Interceptor for outgoing requests. Return modified request or undefined to proceed.
 */
export type RequestInterceptor = (
  url: string,
  init: RequestInit
) =>
  | { url: string; init: RequestInit }
  | void
  | Promise<{ url: string; init: RequestInit } | void>;

/**
 * Interceptor for incoming responses. Return modified result or undefined to proceed.
 */
export type ResponseInterceptor = (
  result: OdooResult<unknown>
) => OdooResult<unknown> | void | Promise<OdooResult<unknown> | void>;

/**
 * Event names supported by the Odoo emitter.
 */
export type OdooEvent = 'connect' | 'disconnect' | 'error';

/**
 * Callback signature for Odoo events.
 */
export type OdooEventCallback = (data?: unknown) => void;

/**
 * The interface for Odoo configuration.
 * It includes the host URL, database name, username, password, and session ID (sid).
 */
export interface OdooConfig {
  host: string;
  database?: string;
  username?: string;
  password?: string;
  sid?: string;
  /**
   * When true (default), the password is cleared from memory after a successful connect.
   * Set to false if you need to reconnect later without re-entering the password.
   */
  clearPasswordAfterConnect?: boolean;
}

/**
 * Standard result wrapper for all Odoo API calls.
 */
export interface OdooResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: OdooError | string;
  sid?: string;
  message?: string;
}

/**
 * Error shape returned by Odoo JSON-RPC.
 */
export interface OdooError {
  message: string;
  code?: number;
  data?: {
    name?: string;
    debug?: string;
    message?: string;
    arguments?: unknown[];
  };
}

/**
 * Type of the raw response returned by Odoo API calls.
 */
interface OdooResponse<T = unknown> {
  result?: T;
  error?: OdooError;
}

/**
 * The interface for request parameters used in Odoo API calls.
 * It includes the model name, method name, and optional arguments and keyword arguments.
 */
export interface RequestParams {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
}

/**
 * Parameters for search and search_read operations.
 */
export interface SearchParams {
  domain?: unknown[];
  offset?: number;
  limit?: number;
  order?: string;
  fields?: string[];
}

/**
 * Parameters for custom method calls.
 */
export interface CallMethodParams {
  args?: unknown[];
  domain?: unknown[];
  offset?: number;
  limit?: number;
  order?: string;
  fields?: string[];
}

/**
 * Parameters for fields_get operation.
 */
export interface FieldsGetParams {
  fields?: string[];
  attributes?: string[];
}

/**
 * Parameters for read_group operation.
 */
export interface ReadGroupParams {
  domain?: unknown[];
  fields?: string[];
  groupby?: string[];
  offset?: number;
  limit?: number;
  orderby?: string;
  lazy?: boolean;
}

/**
 * Data returned after a successful connect.
 */
export interface ConnectData {
  uid: number;
  username: string;
  user_context: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * The Odoo class provides methods to interact with the Odoo API.
 * It allows you to connect to an Odoo instance, perform CRUD operations,
 * search for records, and manage sessions.
 */
class Odoo {
  host: string;
  database?: string;
  username?: string;
  password?: string;
  sid?: string;
  private context: Record<string, unknown> = {};
  private clearPasswordAfterConnect: boolean;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private eventListeners: Map<OdooEvent, Set<OdooEventCallback>> = new Map();

  constructor(config: OdooConfig) {
    this.host = config.host;
    this.database = config.database;
    this.username = config.username;
    this.password = config.password;
    this.sid = config.sid;
    this.clearPasswordAfterConnect = config.clearPasswordAfterConnect ?? true;
  }

  /**
   * Registers a request interceptor. Returns an unsubscribe function.
   * @param interceptor Function to intercept/modify outgoing requests.
   * @returns A function to remove the interceptor.
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const idx = this.requestInterceptors.indexOf(interceptor);
      if (idx >= 0) this.requestInterceptors.splice(idx, 1);
    };
  }

  /**
   * Registers a response interceptor. Returns an unsubscribe function.
   * @param interceptor Function to intercept/modify incoming responses.
   * @returns A function to remove the interceptor.
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const idx = this.responseInterceptors.indexOf(interceptor);
      if (idx >= 0) this.responseInterceptors.splice(idx, 1);
    };
  }

  /**
   * Subscribes to an Odoo event.
   * @param event The event name.
   * @param callback The callback to invoke when the event fires.
   * @returns A function to unsubscribe.
   */
  on(event: OdooEvent, callback: OdooEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribes from an Odoo event.
   * @param event The event name.
   * @param callback The callback to remove.
   */
  off(event: OdooEvent, callback: OdooEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private _emit(event: OdooEvent, data?: unknown): void {
    this.eventListeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch {
        // ignore listener errors
      }
    });
  }

  /**
   * Retrieves the list of databases available on the Odoo server.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async getDatabases(): Promise<OdooResult<string[]>> {
    const url = `${this.host}/web/database/list`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const responseJson = (await response.json()) as OdooResponse<string[]>;

      if (responseJson.error) {
        return { success: false, error: responseJson.error };
      }
      return { success: true, data: responseJson.result };
    } catch (error) {
      return { success: false, error: this._formatError(error) };
    }
  }

  /**
   * Connects to the Odoo instance using the provided credentials.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connect(): Promise<OdooResult<ConnectData>> {
    const params = {
      db: this.database,
      login: this.username,
      password: this.password,
    };

    const url = `${this.host}/web/session/authenticate`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ params }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const responseJson = (await response.json()) as OdooResponse<ConnectData>;
      if (responseJson.error) {
        return { success: false, error: responseJson.error };
      }

      this.sid = this._setCookieToSessionID(response.headers.get('set-cookie'));
      this.context = responseJson.result?.user_context ?? {};
      this.username = responseJson.result?.username;

      if (this.clearPasswordAfterConnect) {
        this.password = undefined;
      }

      this._emit('connect', responseJson.result);

      return {
        success: true,
        data: responseJson.result,
        sid: this.sid,
      };
    } catch (error) {
      return { success: false, error: this._formatError(error) };
    }
  }

  /**
   * Connects to the Odoo instance using the stored session ID.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connectWithSid(): Promise<OdooResult<ConnectData>> {
    const url = `${this.host}/web/session/get_session_info`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Openerp-Session-Id': this.sid || '',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const responseJson = (await response.json()) as OdooResponse<ConnectData>;
      if (responseJson.error) {
        return { success: false, error: responseJson.error };
      }

      this.sid = this._setCookieToSessionID(response.headers.get('set-cookie'));
      this.context = responseJson.result?.user_context ?? {};
      this.username = responseJson.result?.username;
      this._emit('connect', responseJson.result);
      return { success: true, data: responseJson.result };
    } catch (error) {
      return { success: false, error: this._formatError(error) };
    }
  }

  /**
   * Returns the current user context merged with the default context.
   * @returns The current context object.
   */
  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  /**
   * Searches for records in the specified model based on the provided parameters.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<number[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search',
      args: [params.domain],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Reads records in the specified model by their IDs.
   * @param model The name of the model to read from.
   * @param ids The IDs of the records to read.
   * @param fields Optional list of field names to read.
   * @param context Optional context to be used in the read.
   * @returns A promise that resolves to the records' data or an error.
   */
  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'read',
      args: fields ? [ids, fields] : [ids],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Disconnect the current session from the Odoo instance.
   * @returns A promise that resolves to an object containing the success status and message or error.
   */
  async disconnect(): Promise<OdooResult<null>> {
    const url = `${this.host}/web/session/destroy`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const responseJson = (await response.json()) as OdooResponse<null>;
      if (responseJson.error) {
        return { success: false, error: responseJson.error };
      }

      this.sid = undefined;
      this.context = {};
      this.username = undefined;
      this._emit('disconnect');
      return { success: true, message: 'Disconnect successfully' };
    } catch (error) {
      return { success: false, error: this._formatError(error) };
    }
  }

  /**
   * Searches for records in the specified model and reads their data.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain, offset, limit, order, and fields.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search_read<T = Record<string, unknown>>(
    model: string,
    params: SearchParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search_read',
      args: [],
      kwargs: {
        context: { ...this.context, ...context },
        domain: params.domain,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        fields: params.fields,
      },
    });
  }

  /**
   * Counts the number of records in the specified model that match the given domain.
   * @param model The name of the model to count records in.
   * @param domain The domain to filter the records.
   * @param context Optional context to be used in the count.
   * @returns A promise that resolves to the count of records matching the domain.
   */
  async search_count(
    model: string,
    domain: unknown[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<number>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search_count',
      args: [domain],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Retrieves metadata about fields of the specified model.
   * @param model The name of the model.
   * @param params Optional parameters to filter fields and attributes.
   * @param context Optional context.
   * @returns A promise that resolves to field metadata.
   */
  async fields_get<T = Record<string, unknown>>(
    model: string,
    params?: FieldsGetParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'fields_get',
      args: [params?.fields, params?.attributes],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Groups records in the specified model and returns aggregated data.
   * @param model The name of the model.
   * @param params The group by parameters.
   * @param context Optional context.
   * @returns A promise that resolves to grouped records.
   */
  async read_group<T = Record<string, unknown>>(
    model: string,
    params: ReadGroupParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T[]>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'read_group',
      args: [],
      kwargs: {
        context: { ...this.context, ...context },
        domain: params.domain,
        fields: params.fields,
        groupby: params.groupby,
        offset: params.offset,
        limit: params.limit,
        orderby: params.orderby,
        lazy: params.lazy,
      },
    });
  }

  /**
   * Creates a new record in the specified model with the provided parameters.
   * @param model The name of the model to create a record in.
   * @param params The parameters for the new record.
   * @param context Optional context to be used in the creation.
   * @returns A promise that resolves to the created record's data or an error.
   */
  async create<T = number>(
    model: string,
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'create',
      args: [params],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Updates existing records in the specified model with the provided parameters.
   * @param model The name of the model to update records in.
   * @param ids The IDs of the records to update.
   * @param params The parameters to update the records with.
   * @param context Optional context to be used in the update.
   * @returns A promise that resolves to the updated records' data or an error.
   */
  async update(
    model: string,
    ids: number[],
    params: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<OdooResult<boolean>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'write',
      args: [ids, params],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Deletes records in the specified model by their IDs.
   * @param model The name of the model to delete records from.
   * @param ids The IDs of the records to delete.
   * @param context Optional context to be used in the deletion.
   * @returns A promise that resolves to the result of the deletion or an error.
   */
  async delete(
    model: string,
    ids: number[],
    context?: Record<string, unknown>
  ): Promise<OdooResult<boolean>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'unlink',
      args: [ids],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Calls a method on the specified model with the provided parameters.
   * @param model The name of the model to call the method on.
   * @param method The name of the method to call.
   * @param params The parameters for the method call, including args, domain, offset, limit, order, and fields.
   * @param context Optional context to be used in the method call.
   * @returns A promise that resolves to the result of the method call or an error.
   */
  async call_method<T = unknown>(
    model: string,
    method: string,
    params: CallMethodParams,
    context?: Record<string, unknown>
  ): Promise<OdooResult<T>> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: method,
      args: params.args || [],
      kwargs: {
        context: { ...this.context, ...context },
        domain: params.domain,
        offset: params.offset,
        limit: params.limit,
        order: params.order,
        fields: params.fields,
      },
    });
  }

  /**
   * Makes a raw request to the Odoo API with the specified path and parameters.
   * @param path The API endpoint path.
   * @param params The request parameters.
   * @returns A promise that resolves to the response data or an error.
   */
  protected async _request<T = unknown>(
    path: string,
    params: RequestParams
  ): Promise<OdooResult<T>> {
    let url = `${this.host}${path}`;
    let init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Openerp-Session-Id': this.sid || '',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        method: 'call',
        params,
      }),
    };

    for (const interceptor of this.requestInterceptors) {
      const modified = await interceptor(url, init);
      if (modified) {
        url = modified.url;
        init = modified.init;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    if (!init.signal) {
      init.signal = controller.signal;
    }

    try {
      const response = await fetch(url, init);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorResult: OdooResult<T> = {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
        this._emit('error', errorResult.error);
        return errorResult;
      }

      const responseJson = (await response.json()) as OdooResponse<T>;
      if (responseJson.error) {
        const errorResult: OdooResult<T> = {
          success: false,
          error: responseJson.error,
        };
        this._emit('error', responseJson.error);
        return errorResult;
      }

      let result: OdooResult<T> = { success: true, data: responseJson.result };

      for (const interceptor of this.responseInterceptors) {
        const modified = await interceptor(result);
        if (modified) {
          result = modified as OdooResult<T>;
        }
      }

      return result;
    } catch (error) {
      const errorResult: OdooResult<T> = {
        success: false,
        error: this._formatError(error),
      };
      this._emit('error', errorResult.error);
      return errorResult;
    }
  }

  /**
   * Extracts the session ID from the 'set-cookie' header.
   * @param setCookie The 'set-cookie' header value.
   * @returns The session ID if found, otherwise an empty string.
   */
  private _setCookieToSessionID(setCookie: string | null): string {
    if (setCookie && setCookie.includes('session_id')) {
      const match = setCookie.match(/session_id=([^;]+)/);
      return match?.[1] ?? '';
    }
    return '';
  }

  /**
   * Normalizes an unknown error into a string or OdooError.
   * @param error The caught error value.
   * @returns A string representation of the error.
   */
  private _formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return String(error);
  }
}

export default Odoo;
