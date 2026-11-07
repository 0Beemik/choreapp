import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext';
import { countertopMode, onCountertopChange, setCountertopMode } from '../state/countertop';
import { Body, Card, Choice, Heading } from './components';

const TAG = 'countertop';

/** Keeps the screen awake while the app is open, on devices set to countertop mode. Renders nothing. */
export function CountertopKeepAwake() {
  const { services } = useApp();
  const [on, setOn] = useState(false);

  useEffect(() => {
    countertopMode(services).then(setOn).catch(() => undefined);
    return onCountertopChange(setOn);
  }, [services]);

  useEffect(() => {
    if (!on) return;
    activateKeepAwakeAsync(TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(TAG).catch(() => undefined);
    };
  }, [on]);

  return null;
}

/** Settings card for the switch. */
export function CountertopCard() {
  const { services } = useApp();
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    countertopMode(services).then(setOn).catch(() => setOn(false));
  }, [services]);

  if (on === null) return null;
  return (
    <Card>
      <Heading>🍳 Countertop mode</Heading>
      <Body muted>
        For a tablet that lives on the counter: the screen stays on while Family Chores is open. Best with the tablet plugged in. On a wide
        screen the board shows everyone side by side.
      </Body>
      <Choice
        value={on ? 'on' : 'off'}
        onChange={async (v) => {
          setOn(v === 'on');
          await setCountertopMode(services, v === 'on');
        }}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
      />
    </Card>
  );
}
