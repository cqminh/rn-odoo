import { useRef, useState } from 'react';
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
const DEFAULT_USERNAME = process.env.EXPO_PUBLIC_ODOO_USERNAME ?? '';
const DEFAULT_PASSWORD = process.env.EXPO_PUBLIC_ODOO_PASSWORD ?? '';

export default function OdooScreen() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [database, setDatabase] = useState(DEFAULT_DATABASE);
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // A single, shared instance so a session started by Connect can be reused
  // by Connect with SID, Disconnect, and every data call below.
  const odooRef = useRef<Odoo | null>(null);

  const log = (msg: string) => {
    if (msg.startsWith('❌')) console.error('[rn-odoo]', msg);
    else console.log('[rn-odoo]', msg);
    setResult((prev) => (prev ? prev + '\n' : '') + msg);
  };

  const run = async (
    label: string,
    fn: (odoo: Odoo) => Promise<void>,
    { requireSession = false }: { requireSession?: boolean } = {}
  ) => {
    setResult('');
    log(`▶️ ${label}`);

    if (requireSession && !odooRef.current?.sid) {
      log('❌ Connect first — no active session.');
      return;
    }

    setLoading(true);
    try {
      const odoo = odooRef.current ?? new Odoo({ host, database });
      await fn(odoo);
    } catch (err) {
      console.error('[rn-odoo] exception in', label, err);
      log(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDatabases = () =>
    run('Get Databases', async () => {
      const odoo = new Odoo({ host });
      const res = await odoo.getDatabases();
      if (res.success) log(`✅ Databases: ${JSON.stringify(res.data)}`);
      else log(`❌ Error: ${JSON.stringify(res.error)}`);
    });

  const handleConnect = () =>
    run('Connect', async () => {
      odooRef.current = new Odoo({
        host,
        database,
        username,
        password,
        clearPasswordAfterConnect: false,
      });
      const res = await odooRef.current.connect();
      if (res.success) {
        log(`✅ Connected!`);
        log(`   UID: ${res.data?.uid}`);
        log(`   Username: ${res.data?.username}`);
        log(`   SID: ${res.sid}`);
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    });

  const handleConnectWithSid = () =>
    run(
      'Connect with SID (reuse session)',
      async (odoo) => {
        const res = await odoo.connectWithSid();
        if (res.success) log(`✅ Reconnected: ${JSON.stringify(res.data)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleGetContext = () =>
    run(
      'Get Context',
      async (odoo) => {
        const context = odoo.getContext();
        log(`✅ Context: ${JSON.stringify(context)}`);
      },
      { requireSession: true }
    );

  const handleDisconnect = () =>
    run(
      'Disconnect',
      async (odoo) => {
        const res = await odoo.disconnect();
        if (res.success) log(`✅ ${res.message}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleSearch = () =>
    run(
      'Search res.partner (IDs)',
      async (odoo) => {
        const res = await odoo.search('res.partner', {
          domain: [['is_company', '=', true]],
          limit: 5,
        });
        if (res.success) log(`✅ IDs: ${JSON.stringify(res.data)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleRead = () =>
    run(
      'Read res.partner [1]',
      async (odoo) => {
        const res = await odoo.read('res.partner', [1], ['name', 'email']);
        if (res.success) log(`✅ Records: ${JSON.stringify(res.data)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleSearchRead = () =>
    run(
      'Search Read res.partner (Top 5)',
      async (odoo) => {
        const res = await odoo.search_read('res.partner', {
          domain: [],
          fields: ['name', 'email'],
          limit: 5,
        });
        if (res.success) {
          log(`✅ Found ${res.data?.length ?? 0} records`);
          log(JSON.stringify(res.data, null, 2));
        } else {
          log(`❌ Error: ${JSON.stringify(res.error)}`);
        }
      },
      { requireSession: true }
    );

  const handleSearchCount = () =>
    run(
      'Search Count',
      async (odoo) => {
        const res = await odoo.search_count('res.partner', []);
        if (res.success) log(`✅ Count: ${res.data}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleSearchCountWithLimit = () =>
    run(
      'Search Count (limit: 1)',
      async (odoo) => {
        const res = await odoo.search_count(
          'res.partner',
          [['is_company', '=', true]],
          { active_test: true }
        );
        if (res.success) log(`✅ Count: ${res.data}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleFieldsGet = () =>
    run(
      'Fields Get res.partner',
      async (odoo) => {
        const res = await odoo.fields_get('res.partner', {
          fields: ['name', 'email'],
          attributes: ['type', 'string'],
        });
        if (res.success) log(`✅ Fields: ${JSON.stringify(res.data, null, 2)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleReadGroup = () =>
    run(
      'Read Group res.partner',
      async (odoo) => {
        const res = await odoo.read_group('res.partner', {
          domain: [],
          fields: ['country_id'],
          groupby: ['country_id'],
        });
        if (res.success) log(`✅ Groups: ${JSON.stringify(res.data, null, 2)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  const handleCallMethod = () =>
    run(
      'Call Custom Method (name_search)',
      async (odoo) => {
        const res = await odoo.call_method('res.partner', 'name_search', {
          kwargs: { name: '', domain: [], limit: 5 },
        });
        if (res.success) log(`✅ Result: ${JSON.stringify(res.data)}`);
        else log(`❌ Error: ${JSON.stringify(res.error)}`);
      },
      { requireSession: true }
    );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">rn-odoo</ThemedText>
        <ThemedText style={styles.subtitle}>
          Example app for the legacy Odoo JSON-RPC client (v1)
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Host URL</ThemedText>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="https://demo.odoo.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <ThemedText type="defaultSemiBold">Database</ThemedText>
        <TextInput
          style={styles.input}
          value={database}
          onChangeText={setDatabase}
          placeholder="Database name (optional)"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ThemedText type="defaultSemiBold">Username</ThemedText>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Email or login"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />

        <ThemedText type="defaultSemiBold">Password</ThemedText>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Server Info</ThemedText>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetDatabases}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Get Databases</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Auth & Session</ThemedText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleConnect}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Connect</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleConnectWithSid}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Connect with SID</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGetContext}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Get Context</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonHalf,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleDisconnect}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Search & Read</ThemedText>
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
            <ThemedText style={styles.buttonText}>Count (companies)</ThemedText>
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
