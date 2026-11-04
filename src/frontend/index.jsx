import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  DynamicTable, Heading, Lozenge, SectionMessage, Spinner, Stack, Text,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { pageRows } from '../view.js';

const HEAD = {
  cells: [
    { key: 'version', content: 'Version' },
    { key: 'verdict', content: 'Verdict' },
    { key: 'when', content: 'Release date' },
    { key: 'open', content: 'Work' },
    { key: 'failed', content: 'Failed checks (evidence)' },
  ],
};

function App() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    invoke('overview').then(setResult, (e) => setResult({ error: String(e?.message ?? e) }));
  }, []);

  if (!result) return <Spinner label="Checking every upcoming release" />;
  if (result.error) {
    return (
      <SectionMessage appearance="warning" title="Release Gate could not check this project">
        <Text>{result.error}</Text>
      </SectionMessage>
    );
  }

  const rows = pageRows(result).map((r) => ({
    key: r.version,
    cells: [
      { key: 'version', content: r.version },
      { key: 'verdict', content: <Lozenge appearance={r.appearance}>{r.verdict}</Lozenge> },
      { key: 'when', content: r.when },
      { key: 'open', content: r.open },
      { key: 'failed', content: r.failed.length ? r.failed.join(' · ') : 'none' },
    ],
  }));
  const s = result.summary;

  return (
    <Stack space="space.200">
      <Heading as="h2" size="medium">Can these releases go live?</Heading>
      <Text>
        {`${s.go} GO, ${s.go_with_risks} GO WITH RISKS, ${s.no_go} NO-GO in ${result.project}. `}
        Same fixed rules the Release Gate Rovo agent uses: open blockers or an overdue date mean NO-GO.
        Ask the agent in Rovo for the smallest step that turns a check green.
      </Text>
      <DynamicTable caption="Unreleased versions, nearest release date first" head={HEAD} rows={rows} />
    </Stack>
  );
}

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
