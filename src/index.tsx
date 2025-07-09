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
}

/**
 * Type of the response returned by Odoo API calls.
 */
type OdooResponse<T = any> = {
  result?: T;
  error?: {
    message: string;
    [key: string]: any;
  };
};

/**
 * The interface for request parameters used in Odoo API calls.
 * It includes the model name, method name, and optional arguments and keyword arguments.
 */
export interface RequestParams {
  model: string;
  method: string;
  args?: any[];
  kwargs?: Record<string, any>;
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
  private context: Record<string, any> = {};

  constructor(config: OdooConfig) {
    this.host = config.host;
    this.database = config.database;
    this.username = config.username || undefined;
    this.password = config.password || undefined;
    this.sid = config.sid || undefined;
  }

  /**
   * Retrieves the list of databases available on the Odoo server.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async getDatabases(): Promise<any> {
    const url = `${this.host}/web/database/list`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const responseJson = await response.json() as OdooResponse;

      if (responseJson.error) return { success: false, error: responseJson.error };
      return { success: true, data: responseJson.result };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Connects to the Odoo instance using the provided credentials.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connect(): Promise<any> {
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

      const responseJson = await response.json() as OdooResponse;
      if (responseJson.error) return { success: false, error: responseJson.error };

      this.sid = this._setCookieToSessionID(response.headers.get('set-cookie'));
      this.context = responseJson.result.user_context;
      this.username = responseJson.result.username;
      return { success: true, data: responseJson.result, sid: this.sid };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Connects to the Odoo instance using the provided credentials.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async connectWithSid(): Promise<any> {
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

      const responseJson = await response.json() as OdooResponse;
      if (responseJson.error) return { success: false, error: responseJson.error };

      this.context = responseJson.result.user_context;
      this.username = responseJson.result.username;
      return { success: true, data: responseJson.result };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Searches for records in the specified model based on the provided parameters.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search(model: string, params: any, context?: Record<string, any>): Promise<any> {
    return this._request('/web/dataset/call_kw', {
      model,
      method: 'search',
      args: [params.domain],
      kwargs: { context: { ...this.context, ...context } },
    });
  }

  /**
   * Disconnect the current session from the Odoo instance.
   * @returns A promise that resolves to an object containing the success status and message or error.
   */
  async disconnect(): Promise<any> {
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

      const responseJson = await response.json() as OdooResponse;
      if (responseJson.error) return { success: false, error: responseJson.error };

      this.sid = undefined;
      this.context = {};
      this.username = undefined;
      return { success: true, message: 'Disconnect successfully' };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Searches for records in the specified model and reads their data.
   * @param model The name of the model to search in.
   * @param params The search parameters, including the domain, offset, limit, order, and fields.
   * @param context Optional context to be used in the search.
   * @returns A promise that resolves to an object containing the success status and data or error.
   */
  async search_read(model: string, params: any, context?: Record<string, any>): Promise<any> {
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
  async search_count(model: string, domain: any[], context?: Record<string, any>): Promise<number> {
    const response = await this._request('/web/dataset/call_kw', {
      model,
      method: 'search_count',
      args: [domain],
      kwargs: { context: { ...this.context, ...context } },
    });
    return response.success ? response.data : 0;
  }

  /**
   * Creates a new record in the specified model with the provided parameters.
   * @param model The name of the model to create a record in.
   * @param params The parameters for the new record.
   * @param context Optional context to be used in the creation.
   * @returns A promise that resolves to the created record's data or an error.
   */
  async create(model: string, params: any, context?: Record<string, any>): Promise<any> {
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
  async update(model: string, ids: number[], params: any, context?: Record<string, any>): Promise<any> {
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
  async delete(model: string, ids: number[], context?: Record<string, any>): Promise<any> {
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
  async call_method(model: string, method: string, params: any, context?: Record<string, any>): Promise<any> {
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
  private async _request(path: string, params: RequestParams): Promise<any> {
    const url = `${this.host}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Openerp-Session-Id': this.sid || '',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: new Date().getTime(),
          method: 'call',
          params,
        }),
      });

      const responseJson = await response.json() as OdooResponse;
      if (responseJson.error) return { success: false, error: responseJson.error };
      return { success: true, data: responseJson.result };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Extracts the session ID from the 'set-cookie' header.
   * @param setCookie The 'set-cookie' header value.
   * @returns The session ID if found, otherwise an empty string.
   */
  private _setCookieToSessionID = (setCookie: string | null) => {
    if (setCookie && setCookie.includes("session_id") && setCookie !== null) {
      const match = setCookie?.match(/session_id=([^;]+)/);
      return match ? match[1] : "";
    }
    return "";
  }
}

export default Odoo;
