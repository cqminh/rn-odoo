import Odoo from '../index';

describe('Odoo', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createOdoo = (
    overrides?: Partial<ConstructorParameters<typeof Odoo>[0]>
  ) =>
    new Odoo({
      host: 'https://odoo.example.com',
      apiKey: 'test-api-key',
      database: 'test_db',
      ...overrides,
    });

  const lastFetch = () => {
    const call = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    return {
      url: call[0] as string,
      init: call[1] as {
        method?: string;
        headers: Record<string, string> | Headers;
        body?: string;
        signal?: AbortSignal;
      },
      body: call[1].body ? JSON.parse(call[1].body as string) : undefined,
    };
  };

  describe('constructor', () => {
    it('should store config values', () => {
      const odoo = createOdoo();

      expect(odoo.host).toBe('https://odoo.example.com');
      expect(odoo.apiKey).toBe('test-api-key');
      expect(odoo.database).toBe('test_db');
    });

    it('should strip trailing slash from host', () => {
      const odoo = new Odoo({
        host: 'https://odoo.example.com/',
        apiKey: 'key',
      });
      expect(odoo.host).toBe('https://odoo.example.com');
    });
  });

  describe('connect', () => {
    it('should fetch user context via res.users/context_get', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lang: 'en_US', tz: 'UTC' }),
      });

      const odoo = createOdoo();
      const result = await odoo.connect();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ lang: 'en_US', tz: 'UTC' });
      expect(odoo.getContext()).toEqual({ lang: 'en_US', tz: 'UTC' });

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.users/context_get');
      expect(body).toEqual({});
    });

    it('should return error on invalid context response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'invalid-context',
      });

      const odoo = createOdoo();
      const result = await odoo.connect();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid context response from Odoo');
      expect(odoo.getContext()).toEqual({});
    });

    it('should return error when Odoo returns error object in body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'AccessError',
          message: 'Denied',
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.connect();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({ name: 'AccessError', message: 'Denied' });
    });
  });

  describe('disconnect', () => {
    it('should clear context and emit disconnect event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lang: 'en_US' }),
      });

      const odoo = createOdoo();
      await odoo.connect();

      const handler = jest.fn();
      odoo.on('disconnect', handler);

      const result = await odoo.disconnect();
      expect(result.success).toBe(true);
      expect(odoo.getContext()).toEqual({});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    it('should call /json/2/<model>/<method> with named params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [1, 2, 3],
      });

      const odoo = createOdoo();
      const result = await odoo.search('res.partner', {
        domain: [['is_company', '=', true]],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.partner/search');
      expect(body).toEqual({
        context: {},
        domain: [['is_company', '=', true]],
      });
    });
  });

  describe('read', () => {
    it('should read records by ids', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      const odoo = createOdoo();
      const result = await odoo.read('res.partner', [1, 2], ['id', 'name']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.partner/read');
      expect(body).toEqual({
        ids: [1, 2],
        context: {},
        fields: ['id', 'name'],
      });
    });
  });

  describe('search_read', () => {
    it('should return typed records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      const odoo = createOdoo();
      const result = await odoo.search_read<{ id: number; name: string }>(
        'res.partner',
        { domain: [], fields: ['id', 'name'] }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);

      const { url } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.partner/search_read'
      );
    });
  });

  describe('search_count', () => {
    it('should return count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 42,
      });

      const odoo = createOdoo();
      const result = await odoo.search_count('res.partner', [
        ['name', '=', 'A'],
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    it('should send limit when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 1,
      });

      const odoo = createOdoo();
      const result = await odoo.search_count(
        'res.partner',
        [['active', '=', true]],
        1
      );

      expect(result.success).toBe(true);

      const { body } = lastFetch();
      expect(body.limit).toBe(1);
    });
  });

  describe('search_read_paginated', () => {
    it('should fetch all pages automatically', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 3, name: 'C' },
            { id: 4, name: 'D' },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const odoo = createOdoo();
      const result = await odoo.search_read_paginated('res.partner', {
        limit: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
        { id: 4, name: 'D' },
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const { body: lastBody } = lastFetch();
      expect(lastBody).toEqual({
        context: {},
        limit: 2,
        offset: 4,
      });
    });

    it('should respect maxRecords', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 3, name: 'C' },
            { id: 4, name: 'D' },
          ],
        });

      const odoo = createOdoo();
      const result = await odoo.search_read_paginated('res.partner', {
        limit: 2,
        maxRecords: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return error on first failed page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => null,
      });

      const odoo = createOdoo();
      const result = await odoo.search_read_paginated('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');
    });
  });

  describe('web_search_read', () => {
    it('should return records and total length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 1, name: 'Alice' }],
          length: 42,
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.web_search_read('res.partner', {
        domain: [['is_company', '=', true]],
        fields: ['id', 'name'],
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.records).toEqual([{ id: 1, name: 'Alice' }]);
      expect(result.data?.length).toBe(42);

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.partner/web_search_read'
      );
      expect(body).toEqual({
        context: {},
        domain: [['is_company', '=', true]],
        specification: { id: {}, name: {} },
        limit: 10,
      });
    });

    it('should support specification format for relational fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { id: 1, name: 'Alice', partner_id: { id: 5, name: 'Corp' } },
          ],
          length: 1,
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.web_search_read('sale.order', {
        specification: { name: {}, partner_id: { fields: { name: {} } } },
        limit: 5,
      });

      expect(result.success).toBe(true);

      const { body } = lastFetch();
      expect(body.specification).toEqual({
        name: {},
        partner_id: { fields: { name: {} } },
      });
    });

    it('should send count_limit when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [], length: 1000 }),
      });

      const odoo = createOdoo();
      await odoo.web_search_read('res.partner', { count_limit: 1000 });

      const { body } = lastFetch();
      expect(body.count_limit).toBe(1000);
    });
  });

  describe('batch', () => {
    it('should send each call as its own JSON-2 request and collect results in order', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [1, 2, 3] })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: 'A' }],
        });

      const odoo = createOdoo();
      const result = await odoo.batch([
        { model: 'res.partner', method: 'search', params: { domain: [] } },
        {
          model: 'res.partner',
          method: 'read',
          params: { ids: [1], fields: ['name'] },
        },
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([[1, 2, 3], [{ id: 1, name: 'A' }]]);

      const [firstCall, secondCall] = mockFetch.mock.calls;
      expect(firstCall[0]).toBe(
        'https://odoo.example.com/json/2/res.partner/search'
      );
      expect(JSON.parse(firstCall[1].body)).toEqual({
        context: {},
        domain: [],
      });
      expect(secondCall[0]).toBe(
        'https://odoo.example.com/json/2/res.partner/read'
      );
      expect(JSON.parse(secondCall[1].body)).toEqual({
        context: {},
        ids: [1],
        fields: ['name'],
      });
    });

    it('should fail with the first error if any call fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [1] })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({}),
        });

      const odoo = createOdoo();
      const result = await odoo.batch([
        { model: 'res.partner', method: 'search', params: { domain: [] } },
        { model: 'res.partner', method: 'nonexistent', params: {} },
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should create a record and return its id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 99,
      });

      const odoo = createOdoo();
      const result = await odoo.create('res.partner', { name: 'New Partner' });

      expect(result.success).toBe(true);
      expect(result.data).toBe(99);

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.partner/create');
      expect(body).toEqual({
        context: {},
        name: 'New Partner',
      });
    });
  });

  describe('update', () => {
    it('should update records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => true,
      });

      const odoo = createOdoo();
      const result = await odoo.update('res.partner', [1, 2], {
        name: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.partner/write');
      expect(body).toEqual({
        ids: [1, 2],
        context: {},
        name: 'Updated',
      });
    });
  });

  describe('delete', () => {
    it('should delete records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => true,
      });

      const odoo = createOdoo();
      const result = await odoo.delete('res.partner', [3]);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      const { url, body } = lastFetch();
      expect(url).toBe('https://odoo.example.com/json/2/res.partner/unlink');
      expect(body).toEqual({
        ids: [3],
        context: {},
      });
    });
  });

  describe('fields_get', () => {
    it('should return field metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: { type: 'char', string: 'Name' },
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.fields_get('res.partner', {
        fields: ['name', 'email'],
        attributes: ['type', 'string'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('name');

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.partner/fields_get'
      );
      expect(body).toEqual({
        context: {},
        allfields: ['name', 'email'],
        attributes: ['type', 'string'],
      });
    });
  });

  describe('read_group', () => {
    it('should return grouped records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ country_id: [1, 'Vietnam'], country_id_count: 5 }],
      });

      const odoo = createOdoo();
      const result = await odoo.read_group('res.partner', {
        domain: [['is_company', '=', true]],
        fields: ['country_id'],
        groupby: ['country_id'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.partner/read_group'
      );
      expect(body.groupby).toEqual(['country_id']);
    });
  });

  describe('call_method', () => {
    it('should call custom method with ids and kwargs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom: 'value' }),
      });

      const odoo = createOdoo();
      const result = await odoo.call_method('res.partner', 'custom_method', {
        ids: [1],
        kwargs: { context: { active_id: 1 } },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ custom: 'value' });

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.partner/custom_method'
      );
      expect(body).toEqual({
        ids: [1],
        context: { active_id: 1 },
      });
    });

    it('should merge kwargs context with instance and call context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lang: 'en_US', tz: 'UTC' }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom: 'value' }),
      });

      const odoo = createOdoo();
      await odoo.connect();
      const result = await odoo.call_method(
        'res.partner',
        'custom_method',
        {
          ids: [1],
          kwargs: { context: { active_id: 1 }, custom_param: 'value' },
        },
        { lang: 'vi_VN' }
      );

      expect(result.success).toBe(true);

      const { body } = lastFetch();
      expect(body).toEqual({
        ids: [1],
        context: { lang: 'vi_VN', tz: 'UTC', active_id: 1 },
        custom_param: 'value',
      });
    });
  });

  describe('generateApiKey', () => {
    it('should generate a new API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'new-api-key',
      });

      const odoo = createOdoo();
      const result = await odoo.generateApiKey({
        name: 'Mobile App',
        expiration_date: '2026-12-31',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('new-api-key');

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.users.apikeys/generate'
      );
      expect(body).toEqual({
        key: 'test-api-key',
        scope: null,
        name: 'Mobile App',
        expiration_date: '2026-12-31',
      });
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke the current API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const odoo = createOdoo();
      const result = await odoo.revokeApiKey();

      expect(result.success).toBe(true);

      const { url, body } = lastFetch();
      expect(url).toBe(
        'https://odoo.example.com/json/2/res.users.apikeys/revoke'
      );
      expect(body).toEqual({ key: 'test-api-key' });
    });
  });

  describe('getVersion', () => {
    it('should fetch version from /web/version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '19.0',
          version_info: [19, 0, 0, 'final', 0, ''],
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.getVersion();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        version: '19.0',
        version_info: [19, 0, 0, 'final', 0, ''],
      });

      const { url, init } = lastFetch();
      expect(url).toBe('https://odoo.example.com/web/version');
      expect(init.method).toBe('GET');
    });
  });

  describe('getDatabases', () => {
    it('should fetch database list from /web/database/list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: ['db1', 'db2'] }),
      });

      const odoo = createOdoo();
      const result = await odoo.getDatabases();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['db1', 'db2']);

      const { url, body, init } = lastFetch();
      expect(url).toBe('https://odoo.example.com/web/database/list');
      expect(init.method).toBe('POST');
      expect(body).toEqual({});
    });
  });

  describe('headers', () => {
    it('should send Authorization, X-Odoo-Database and User-Agent headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        apiKey: 'secret-key',
        database: 'test_db',
        userAgent: 'mysoftware/1.0',
      });
      await odoo.search('res.partner', {});

      const { init } = lastFetch();
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe('bearer secret-key');
      expect(headers['X-Odoo-Database']).toBe('test_db');
      expect(headers['User-Agent']).toBe('mysoftware/1.0');
      expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
    });
  });

  describe('error handling', () => {
    it('should return OdooError on 4xx/5xx with JSON-2 error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          name: 'werkzeug.exceptions.Unauthorized',
          message: 'Invalid apikey',
          arguments: ['Invalid apikey', 401],
        }),
      });

      const odoo = createOdoo();
      const result = await odoo.search('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        name: 'werkzeug.exceptions.Unauthorized',
        message: 'Invalid apikey',
        arguments: ['Invalid apikey', 401],
      });
    });

    it('should return HTTP string error when body is not Odoo error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server crashed' }),
      });

      const odoo = createOdoo();
      const result = await odoo.search('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');
    });

    it('should emit error event on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => null,
      });

      const odoo = createOdoo();
      const handler = jest.fn();
      odoo.on('error', handler);

      await odoo.search('res.partner', {});
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('HTTP 500: Internal Server Error');
    });

    it('should not retry 4xx client errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Not found' }),
      });

      const odoo = createOdoo({ retry: { count: 2, delay: 10 } });
      const result = await odoo.search('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404: Not Found');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => null,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const odoo = createOdoo({ retry: { count: 2, delay: 10 } });
      const result = await odoo.search('res.partner', {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const odoo = createOdoo();
      const result = await odoo.search('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('interceptors', () => {
    it('should allow request interceptor to modify url and headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'ok',
      });

      const odoo = createOdoo();
      odoo.addRequestInterceptor((url, init) => {
        const headers = new Headers(init.headers as unknown as Headers);
        headers.set('X-Custom-Header', 'test');
        return {
          url: url.replace('odoo', 'odoo2'),
          init: { ...init, headers },
        };
      });

      await odoo.search_read('res.partner', {});

      const { url, init } = lastFetch();
      expect(url).toBe(
        'https://odoo2.example.com/json/2/res.partner/search_read'
      );
      expect((init.headers as unknown as Headers).get('X-Custom-Header')).toBe(
        'test'
      );
    });

    it('should allow response interceptor to modify result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1 }],
      });

      const odoo = createOdoo();
      odoo.addResponseInterceptor((result) => {
        if (result.success && Array.isArray(result.data)) {
          return {
            ...result,
            data: result.data.map((r: any) => ({ ...r, injected: true })),
          };
        }
        return undefined;
      });

      const res = await odoo.search_read('res.partner', {});
      expect(res.data).toEqual([{ id: 1, injected: true }]);
    });

    it('should support async request interceptors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'ok',
      });

      const odoo = createOdoo();
      odoo.addRequestInterceptor(async (url, init) => {
        await Promise.resolve();
        return {
          url: url.replace('odoo', 'odoo3'),
          init: { ...init, headers: { ...init.headers, 'X-Async': 'yes' } },
        };
      });

      await odoo.search_read('res.partner', {});

      const { url, init } = lastFetch();
      expect(url).toBe(
        'https://odoo3.example.com/json/2/res.partner/search_read'
      );
      expect((init.headers as Record<string, string>)['X-Async']).toBe('yes');
    });

    it('should support async response interceptors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1 }],
      });

      const odoo = createOdoo();
      odoo.addResponseInterceptor(async (result) => {
        await Promise.resolve();
        if (result.success && Array.isArray(result.data)) {
          return {
            ...result,
            data: result.data.map((r: any) => ({ ...r, async: true })),
          };
        }
        return undefined;
      });

      const res = await odoo.search_read('res.partner', {});
      expect(res.data).toEqual([{ id: 1, async: true }]);
    });
  });

  describe('events', () => {
    it('should support unsubscribing from events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lang: 'en_US' }),
      });

      const odoo = createOdoo();
      const handler = jest.fn();
      const unsub = odoo.on('connect', handler);
      unsub();

      await odoo.connect();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('request timeout', () => {
    it('should pass AbortController signal to fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const odoo = createOdoo();
      await odoo.search_read('res.partner', {});

      const { init } = lastFetch();
      expect(init.signal).toBeDefined();
      expect(init.signal instanceof AbortSignal).toBe(true);
    });

    it('should use custom timeout from config', async () => {
      mockFetch.mockImplementationOnce((___, init) => {
        return new Promise((_resolve, reject) => {
          const signal = init.signal as AbortSignal;
          if (signal.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          signal.addEventListener('abort', () => reject(new Error('Aborted')), {
            once: true,
          });
        });
      });

      const odoo = createOdoo({ timeout: 100 });
      const result = await odoo.search_read('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/aborted|timeout/i);
    });

    it('should preserve signal from request interceptor', async () => {
      mockFetch.mockImplementationOnce((___, init) => {
        return new Promise((_resolve, reject) => {
          const signal = init.signal as AbortSignal;
          if (signal.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          signal.addEventListener('abort', () => reject(new Error('Aborted')), {
            once: true,
          });
        });
      });

      const odoo = createOdoo();
      const userController = new AbortController();
      odoo.addRequestInterceptor((url, init) => ({
        url,
        init: { ...init, signal: userController.signal },
      }));

      const promise = odoo.search_read('res.partner', {});
      setTimeout(() => userController.abort(), 50);
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/aborted/i);
    });
  });

  describe('retry', () => {
    it('should retry failed requests and succeed on retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1 }],
        });

      const odoo = createOdoo({ retry: { count: 2, delay: 10 } });
      const result = await odoo.search_read('res.partner', {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1 }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return last error when all retries fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const odoo = createOdoo({ retry: { count: 2, delay: 10 } });
      const result = await odoo.search_read('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry aborted requests', async () => {
      mockFetch.mockImplementationOnce((___, init) => {
        return new Promise((_resolve, reject) => {
          const signal = init.signal as AbortSignal;
          if (signal.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          signal.addEventListener('abort', () => reject(new Error('Aborted')), {
            once: true,
          });
        });
      });

      const odoo = createOdoo({ timeout: 50, retry: { count: 2, delay: 10 } });
      const result = await odoo.search_read('res.partner', {});

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/aborted/i);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('context merging', () => {
    it('should merge connect context with per-call context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lang: 'en_US', tz: 'UTC' }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const odoo = createOdoo();
      await odoo.connect();
      await odoo.search('res.partner', {}, { active_test: false });

      const { body } = lastFetch();
      expect(body.context).toEqual({
        lang: 'en_US',
        tz: 'UTC',
        active_test: false,
      });
    });
  });

  describe('exports', () => {
    it('should support named export', () => {
      const { Odoo: NamedOdoo } = require('../index');
      const odoo = new NamedOdoo({
        host: 'https://odoo.example.com',
        apiKey: 'k',
      });
      expect(odoo.host).toBe('https://odoo.example.com');
    });
  });
});
