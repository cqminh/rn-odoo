import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Odoo from 'rn-odoo';

const DEFAULT_HOST =
  process.env.EXPO_PUBLIC_ODOO_HOST ?? 'https://demo.odoo.com';
const DEFAULT_DATABASE = process.env.EXPO_PUBLIC_ODOO_DATABASE ?? '';
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_ODOO_API_KEY ?? '';

export default function OdooScreen() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [database, setDatabase] = useState(DEFAULT_DATABASE);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const log = (msg: string) => {
    if (msg.startsWith('❌')) console.error('[rn-odoo]', msg);
    else console.log('[rn-odoo]', msg);
    setResult((prev) => (prev ? prev + '\n' : '') + msg);
  };

  const makeOdoo = () =>
    new Odoo({
      host,
      database: database || undefined,
      apiKey,
      userAgent: 'rn-odoo-example/1.0',
    });

  const run = async (label: string, fn: (odoo: Odoo) => Promise<void>) => {
    setResult('');
    log(`▶️ ${label}`);

    if (!apiKey) {
      log('❌ Enter an API key first.');
      return;
    }

    setLoading(true);
    try {
      const odoo = makeOdoo();
      await fn(odoo);
    } catch (err) {
      console.error('[rn-odoo] exception in', label, err);
      log(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDatabases = () =>
    run('Get Databases', async (odoo) => {
      const res = await odoo.getDatabases();
      if (res.success) log(`✅ Databases: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleGetVersion = () =>
    run('Get Version', async (odoo) => {
      const res = await odoo.getVersion();
      if (res.success) log(`✅ Version: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleConnect = () =>
    run('Connect (context_get)', async (odoo) => {
      const res = await odoo.connect();
      if (res.success) {
        log(`✅ Connected! Context:`);
        log(JSON.stringify(res.data, null, 2));
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleSearch = () =>
    run('Search res.partner', async (odoo) => {
      const res = await odoo.search('res.partner', {
        domain: [['is_company', '=', true]],
        limit: 5,
      });
      if (res.success) log(`✅ IDs: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleSearchRead = () =>
    run('Search Read res.partner', async (odoo) => {
      const res = await odoo.search_read('res.partner', {
        domain: [],
        fields: ['id', 'name', 'email'],
        limit: 5,
      });
      if (res.success) {
        log(`✅ Found ${res.data?.length ?? 0} records`);
        log(JSON.stringify(res.data, null, 2));
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleSearchReadPaginated = () =>
    run('Search Read Paginated', async (odoo) => {
      const res = await odoo.search_read_paginated('res.partner', {
        domain: [],
        fields: ['id', 'name'],
        limit: 10,
        maxRecords: 25,
      });
      if (res.success) {
        log(`✅ Fetched ${res.data?.length ?? 0} records total`);
        log(JSON.stringify(res.data, null, 2));
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleWebSearchRead = () =>
    run('Web Search Read (records + total)', async (odoo) => {
      const res = await odoo.web_search_read('res.partner', {
        domain: [],
        fields: ['id', 'name', 'email'],
        limit: 5,
        count_limit: 1000,
      });
      if (res.success) {
        log(
          `✅ Page: ${res.data?.records.length ?? 0} records, Total: ${res.data?.length}`
        );
        log(JSON.stringify(res.data?.records, null, 2));
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleSearchCount = () =>
    run('Search Count', async (odoo) => {
      const res = await odoo.search_count('res.partner', []);
      if (res.success) log(`✅ Count: ${res.data}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleSearchCountWithLimit = () =>
    run('Search Count (limit: 1)', async (odoo) => {
      const res = await odoo.search_count(
        'res.partner',
        [['is_company', '=', true]],
        1
      );
      if (res.success) log(`✅ Count (capped at 1): ${res.data}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleRead = () =>
    run('Read res.partner [1]', async (odoo) => {
      const res = await odoo.read('res.partner', [1], ['id', 'name', 'email']);
      if (res.success) log(`✅ Records: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleFieldsGet = () =>
    run('Fields Get res.partner', async (odoo) => {
      const res = await odoo.fields_get('res.partner', {
        fields: ['name', 'email'],
        attributes: ['type', 'string'],
      });
      if (res.success) log(`✅ Fields: ${JSON.stringify(res.data, null, 2)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleReadGroup = () =>
    run('Read Group res.partner', async (odoo) => {
      const res = await odoo.read_group('res.partner', {
        domain: [],
        fields: ['country_id'],
        groupby: ['country_id'],
      });
      if (res.success) log(`✅ Groups: ${JSON.stringify(res.data, null, 2)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleCallMethod = () =>
    // name_search still exists on modern Odoo; name_get was removed in
    // favor of the computed `display_name` field. Odoo 17+ also renamed
    // name_search's `args` parameter to `domain`.
    run('Call Custom Method', async (odoo) => {
      const res = await odoo.call_method('res.partner', 'name_search', {
        kwargs: { name: '', domain: [], limit: 5 },
      });
      if (res.success) log(`✅ Result: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleBatch = () =>
    run('Batch Request', async (odoo) => {
      const res = await odoo.batch([
        {
          model: 'res.partner',
          method: 'search_count',
          params: { domain: [] },
        },
        {
          model: 'res.partner',
          method: 'search_read',
          params: { domain: [], fields: ['id', 'name'], limit: 3 },
        },
      ]);
      if (res.success)
        log(`✅ Batch results: ${JSON.stringify(res.data, null, 2)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleGenerateApiKey = () =>
    run('Generate API Key', async (odoo) => {
      const res = await odoo.generateApiKey({
        name: 'rn-odoo-example',
        expiration_date: '2026-12-31',
      });
      if (res.success) {
        log(`✅ New API key generated (copy it now):`);
        log(res.data ?? '');
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleRevokeApiKey = () =>
    run('Revoke Current API Key', async (odoo) => {
      const res = await odoo.revokeApiKey();
      if (res.success) log(`✅ API key revoked successfully`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">rn-odoo</ThemedText>
        <ThemedText style={styles.subtitle}>
          Example app for the Odoo JSON-2 API client
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoBox}>
        <ThemedText type="defaultSemiBold">🔑 How to get an API key</ThemedText>
        <ThemedText style={styles.infoText}>
          1. Log in to your Odoo instance in a browser.{'\n'}
          2. Open your user menu (avatar) → Preferences.{'\n'}
          3. Go to Account Security → New API Key.{'\n'}
          4. Copy the key and paste it below.{'\n'}
          {'\n'}
          The JSON-2 API does not support username/password login. For consumer
          apps, use a backend proxy: your app sends credentials to your backend,
          the backend creates an Odoo API key, and the app uses that key with
          rn-odoo.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Host URL</ThemedText>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="https://mycompany.odoo.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <ThemedText type="defaultSemiBold">Database (optional)</ThemedText>
        <TextInput
          style={styles.input}
          value={database}
          onChangeText={setDatabase}
          placeholder="Database name"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ThemedText type="defaultSemiBold">API Key</ThemedText>
        <TextInput
          style={[styles.input, styles.apiKeyInput]}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Paste your Odoo API key here"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Server Info</ThemedText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGetVersion}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Version</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGetDatabases}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Databases</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Auth & Context</ThemedText>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Connect (Fetch Context)
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">CRUD & Search</ThemedText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSearch}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Search (IDs)</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRead}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Read [1]</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearchRead}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Search Read (Top 5)</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearchReadPaginated}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Search Read Paginated
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleWebSearchRead}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Web Search Read (page + total)
          </ThemedText>
        </TouchableOpacity>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSearchCount}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Count All</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSearchCountWithLimit}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Count (limit: 1)</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Metadata & Custom</ThemedText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleFieldsGet}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Fields Get</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleReadGroup}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Read Group</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCallMethod}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Call Method (name_search)
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleBatch}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Batch Request</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">API Key Management</ThemedText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGenerateApiKey}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Generate Key</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRevokeApiKey}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Revoke Key</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {result ? (
        <ThemedView style={styles.section}>
          <View style={styles.resultHeader}>
            <ThemedText type="defaultSemiBold">Result</ThemedText>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setResult('')}
            >
              <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedView style={styles.resultBox}>
            <ThemedText style={styles.resultText}>{result}</ThemedText>
          </ThemedView>
        </ThemedView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  hero: {
    gap: 8,
    marginBottom: 24,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1a3c4a',
  },
  section: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  apiKeyInput: {
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  clearButtonText: {
    color: '#0a7ea4',
    fontSize: 13,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
