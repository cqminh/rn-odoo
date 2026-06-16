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

  describe('constructor', () => {
    it('should store config values', () => {
      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'secret',
        sid: 'abc123',
      });

      expect(odoo.host).toBe('https://odoo.example.com');
      expect(odoo.database).toBe('test_db');
      expect(odoo.username).toBe('admin');
      expect(odoo.password).toBe('secret');
      expect(odoo.sid).toBe('abc123');
    });

    it('should allow optional fields to be undefined', () => {
      const odoo = new Odoo({ host: 'https://odoo.example.com' });

      expect(odoo.database).toBeUndefined();
      expect(odoo.username).toBeUndefined();
      expect(odoo.password).toBeUndefined();
      expect(odoo.sid).toBeUndefined();
    });
  });

  describe('getDatabases', () => {
    it('should return databases on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: ['db1', 'db2'] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com' });
      const result = await odoo.getDatabases();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['db1', 'db2']);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://odoo.example.com/web/database/list',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should return error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com' });
      const result = await odoo.getDatabases();

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 500: Internal Server Error');
    });

    it('should return error on Odoo JSON-RPC error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: { message: 'Access denied' } }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com' });
      const result = await odoo.getDatabases();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({ message: 'Access denied' });
    });

    it('should return error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const odoo = new Odoo({ host: 'https://odoo.example.com' });
      const result = await odoo.getDatabases();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('connect', () => {
    it('should authenticate and extract session id from cookie', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'session_id=xyz789; Path=/',
        },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: { lang: 'en_US' },
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'secret',
      });
      const result = await odoo.connect();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        uid: 1,
        username: 'admin',
        user_context: { lang: 'en_US' },
      });
      expect(result.sid).toBe('xyz789');
      expect(odoo.sid).toBe('xyz789');
    });

    it('should clear password after successful connect by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'session_id=xyz789; Path=/' },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: {},
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'secret',
      });
      await odoo.connect();

      expect(odoo.password).toBeUndefined();
    });

    it('should keep password when clearPasswordAfterConnect is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'session_id=xyz789; Path=/' },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: {},
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'secret',
        clearPasswordAfterConnect: false,
      });
      await odoo.connect();

      expect(odoo.password).toBe('secret');
    });

    it('should return error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({ error: { message: 'Wrong login/password' } }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'wrong',
      });
      const result = await odoo.connect();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({ message: 'Wrong login/password' });
    });
  });

  describe('connectWithSid', () => {
    it('should validate session and update context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          result: {
            uid: 2,
            username: 'demo',
            user_context: { lang: 'vi_VN' },
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        sid: 'existing_sid',
      });
      const result = await odoo.connectWithSid();

      expect(result.success).toBe(true);
      expect(result.data?.username).toBe('demo');
      expect(odoo.username).toBe('demo');
    });
  });

  describe('getContext', () => {
    it('should return a copy of the current context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: { lang: 'en_US', tz: 'UTC' },
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'secret',
      });
      await odoo.connect();

      const ctx = odoo.getContext();
      expect(ctx).toEqual({ lang: 'en_US', tz: 'UTC' });

      // Mutating returned context should not affect internal state
      ctx.lang = 'vi_VN';
      expect(odoo.getContext().lang).toBe('en_US');
    });

    it('should return empty object before connect', () => {
      const odoo = new Odoo({ host: 'https://odoo.example.com' });
      expect(odoo.getContext()).toEqual({});
    });
  });

  describe('read', () => {
    it('should read records by ids', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
          ],
        }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.read<{
        id: number;
        name: string;
        email: string;
      }>('res.partner', [1, 2], ['id', 'name', 'email']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ]);
    });

    it('should read without fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [{ id: 1 }] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.read('res.partner', [1]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1 }]);
    });
  });

  describe('search', () => {
    it('should call search method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [1, 2, 3] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.search('res.partner', {
        domain: [['is_company', '=', true]],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('search_read', () => {
    it('should return typed records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.search_read<{ id: number; name: string }>(
        'res.partner',
        { domain: [], fields: ['id', 'name'] }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });
  });

  describe('search_count', () => {
    it('should return count wrapped in OdooResult', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 42 }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.search_count('res.partner', [
        ['name', '=', 'A'],
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });
  });

  describe('create', () => {
    it('should create a record and return its id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 99 }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.create('res.partner', { name: 'New Partner' });

      expect(result.success).toBe(true);
      expect(result.data).toBe(99);
    });
  });

  describe('update', () => {
    it('should update records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: true }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.update('res.partner', [1, 2], {
        name: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: true }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.delete('res.partner', [3]);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('call_method', () => {
    it('should call custom method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { custom: 'value' } }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.call_method('res.partner', 'custom_method', {
        args: [1],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ custom: 'value' });
    });
  });

  describe('disconnect', () => {
    it('should clear session on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: null }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        sid: 'sid',
        username: 'admin',
      });
      const result = await odoo.disconnect();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Disconnect successfully');
      expect(odoo.sid).toBeUndefined();
      expect(odoo.username).toBeUndefined();
    });
  });

  describe('interceptors', () => {
    it('should allow request interceptor to modify url and headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'ok' }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      odoo.addRequestInterceptor((url, init) => {
        const headers = new Headers(init.headers as unknown as Headers);
        headers.set('X-Custom-Header', 'test');
        return {
          url: url.replace('odoo', 'odoo2'),
          init: { ...init, headers },
        };
      });

      await odoo.search_read('res.partner', {});

      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe('https://odoo2.example.com/web/dataset/call_kw');
      expect((calledInit.headers as Headers).get('X-Custom-Header')).toBe(
        'test'
      );
    });

    it('should allow response interceptor to modify result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [{ id: 1 }] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
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

    it('should support unsubscribing interceptors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'ok' }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const interceptor = jest.fn();
      const unsub = odoo.addRequestInterceptor(interceptor);
      unsub();

      await odoo.search_read('res.partner', {});
      expect(interceptor).not.toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('should emit connect event on successful connect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'session_id=abc; Path=/' },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: {},
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'db',
        username: 'admin',
        password: 'secret',
      });
      const handler = jest.fn();
      odoo.on('connect', handler);

      await odoo.connect();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 1, username: 'admin' })
      );
    });

    it('should emit disconnect event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: null }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const handler = jest.fn();
      odoo.on('disconnect', handler);

      await odoo.disconnect();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit error event on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const handler = jest.fn();
      odoo.on('error', handler);

      await odoo.search_read('res.partner', {});
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('HTTP 500: Internal Server Error');
    });

    it('should support unsubscribing from events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'session_id=abc; Path=/' },
        json: async () => ({
          result: {
            uid: 1,
            username: 'admin',
            user_context: {},
          },
        }),
      });

      const odoo = new Odoo({
        host: 'https://odoo.example.com',
        database: 'db',
        username: 'admin',
        password: 'secret',
      });
      const handler = jest.fn();
      const unsub = odoo.on('connect', handler);
      unsub();

      await odoo.connect();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('read without fields', () => {
    it('should not pass undefined fields in args', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [{ id: 1, name: 'A' }] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      await odoo.read('res.partner', [1, 2]);

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.params.args).toEqual([[1, 2]]);
    });
  });

  describe('fields_get', () => {
    it('should return field metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            name: { type: 'char', string: 'Name' },
            email: { type: 'char', string: 'Email' },
          },
        }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.fields_get('res.partner', {
        fields: ['name', 'email'],
        attributes: ['type', 'string'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('email');

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.params.method).toBe('fields_get');
      expect(body.params.args).toEqual([
        ['name', 'email'],
        ['type', 'string'],
      ]);
    });
  });

  describe('read_group', () => {
    it('should return grouped records', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            { country_id: [1, 'Vietnam'], country_id_count: 5 },
            { country_id: [2, 'USA'], country_id_count: 3 },
          ],
        }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      const result = await odoo.read_group('res.partner', {
        domain: [['is_company', '=', true]],
        fields: ['country_id'],
        groupby: ['country_id'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.params.method).toBe('read_group');
      expect(body.params.kwargs.groupby).toEqual(['country_id']);
    });
  });

  describe('jsonrpc id', () => {
    it('should generate unique string ids across calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [] }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      await odoo.search_read('res.partner', {});
      await odoo.search_read('res.partner', {});

      const [, init1] = mockFetch.mock.calls[0];
      const [, init2] = mockFetch.mock.calls[1];
      const id1 = JSON.parse(init1.body).id;
      const id2 = JSON.parse(init2.body).id;

      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });

  describe('request timeout', () => {
    it('should pass AbortController signal to fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [] }),
      });

      const odoo = new Odoo({ host: 'https://odoo.example.com', sid: 'sid' });
      await odoo.search_read('res.partner', {});

      const [, init] = mockFetch.mock.calls[0];
      expect(init.signal).toBeDefined();
      expect(init.signal instanceof AbortSignal).toBe(true);
    });
  });
});
