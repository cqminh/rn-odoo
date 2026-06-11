import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Odoo from 'rn-odoo';

export default function OdooScreen() {
  const [host, setHost] = useState('https://demo.odoo.com');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const log = (msg: string) =>
    setResult((prev) => (prev ? prev + '\n' : '') + msg);

  const handleGetDatabases = async () => {
    setLoading(true);
    setResult('');
    try {
      const odoo = new Odoo({ host });
      log('📡 Fetching databases...');
      const res = await odoo.getDatabases();
      if (res.success) {
        log(`✅ Databases: ${JSON.stringify(res.data)}`);
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    } catch (err) {
      log(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setResult('');
    try {
      const odoo = new Odoo({ host, database, username, password });
      log('🔐 Connecting...');
      const res = await odoo.connect();
      if (res.success) {
        log(`✅ Connected!`);
        log(`   UID: ${res.data?.uid}`);
        log(`   Username: ${res.data?.username}`);
        log(`   SID: ${res.sid}`);
      } else {
        log(`❌ Error: ${JSON.stringify(res.error)}`);
      }
    } catch (err) {
      log(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRead = async () => {
    setLoading(true);
    setResult('');
    try {
      const odoo = new Odoo({ host, database, username, password });
      log('🔐 Connecting...');
      const connectRes = await odoo.connect();
      if (!connectRes.success) {
        log(`❌ Connect failed: ${JSON.stringify(connectRes.error)}`);
        return;
      }
      log(`✅ Connected! Searching res.partner...`);
      const searchRes = await odoo.search_read('res.partner', {
        domain: [],
        fields: ['name', 'email'],
        limit: 5,
      });
      if (searchRes.success) {
        log(
          `✅ Found ${(searchRes.data as Record<string, unknown>[])?.length ?? 0} records`
        );
        log(JSON.stringify(searchRes.data, null, 2));
      } else {
        log(`❌ Search error: ${JSON.stringify(searchRes.error)}`);
      }
    } catch (err) {
      log(`❌ Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">rn-odoo</ThemedText>
        <ThemedText style={styles.subtitle}>
          A lightweight React Native library for connecting to Odoo JSON-RPC &
          XML-RPC APIs
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
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetDatabases}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Get Databases</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Connect</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearchRead}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            Search Partners (Top 5)
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {result ? (
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Result:</ThemedText>
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
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
