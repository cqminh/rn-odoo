import { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import Odoo from 'rn-odoo';

const host = 'https://your-odoo-instance.com'; // Replace with your Odoo instance URL
const database = 'your_database_name'; // Replace with your Odoo database name
const username = 'your_username'; // Replace with your Odoo username
const password = 'your_password'; // Replace with your Odoo password

export default function App() {
  const [sid, setSid] = useState<string | undefined>('');
  const odoo = new Odoo({
    host,
    database,
    username,
    password,
  })

  return (
    <View style={styles.container}>
      <Button
        title='Login'
        onPress={async () => {
          await odoo
            .connect()
            .then((res) => {
              if (res.success) {
                setSid(odoo.sid);
              } else {
                console.error('Login failed:', res.error);
              }
            });
        }}
      />
      <Text>{`Your seassion ID is: ${sid}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
