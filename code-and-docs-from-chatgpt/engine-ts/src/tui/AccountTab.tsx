import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  listProfiles,
  getActive,
  setActive,
  loadActive,
  KeaNotConfiguredError,
  redactKeyId,
} from '../credentials.js';

export function AccountTab(): JSX.Element {
  const [, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const profiles = listProfiles();
  const active = getActive();

  useInput((input) => {
    if (input === 's' && profiles.length > 1) {
      const idx = profiles.indexOf(active ?? '');
      const next = profiles[(idx + 1) % profiles.length];
      try {
        setActive(next);
        setError(null);
        setVersion((v) => v + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  });

  if (profiles.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text>No Kalshi profile configured.</Text>
        <Text>
          Run <Text bold>kea login</Text> in your shell to connect.
        </Text>
      </Box>
    );
  }

  let info: { profile: string; keyIdLast4: string; baseUrl: string; isDemo: boolean };
  try {
    const a = loadActive();
    info = {
      profile: a.profileName,
      keyIdLast4: redactKeyId(a.keyId),
      baseUrl: a.baseUrl,
      isDemo: a.baseUrl.includes('demo'),
    };
  } catch (e) {
    return (
      <Text color="red">
        {e instanceof KeaNotConfiguredError ? e.message : String(e)}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>
        profile: <Text bold>{info.profile}</Text> {info.isDemo ? '[DEMO]' : '[PROD]'}
      </Text>
      <Text>key id : {info.keyIdLast4}</Text>
      <Text>baseUrl: {info.baseUrl}</Text>
      <Text dimColor>
        press <Text bold>s</Text> to switch profile ({profiles.join(', ')})
      </Text>
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
}
