import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext';
import { useSync } from '../state/SyncContext';
import { Body, Card, Choice, Heading } from '../ui/components';
import { setBackgroundSync } from './background';
import { notificationsAllowed } from './deliver';
import { choreUpdatesEnabled, phoneNotificationsEnabled, setChoreUpdatesEnabled, setPhoneNotificationsEnabled } from './phoneNotices';

/** Per-device switch for phone notifications (this device only; other phones keep their own). */
export function PhoneNotificationsCard() {
  const { services } = useApp();
  const { mode } = useSync();
  const [on, setOn] = useState<boolean | null>(null);
  const [chores, setChores] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    phoneNotificationsEnabled(services).then(setOn).catch(() => setOn(true));
    choreUpdatesEnabled(services).then(setChores).catch(() => undefined);
  }, [services]);

  const change = async (next: 'on' | 'off') => {
    const enabled = next === 'on';
    setOn(enabled);
    await setPhoneNotificationsEnabled(services, enabled);
    setBlocked(enabled && !(await notificationsAllowed(true)));
    await setBackgroundSync(enabled && mode === 'member');
  };

  if (on === null) return null;
  return (
    <Card>
      <Heading>🔔 Phone notifications</Heading>
      <Body muted>
        Pops up when someone buys your chore, pushes one onto you, or a deal settles — and tells parents when chores get done.
        {mode === 'member' ? ' With the app closed, this phone checks in with the main device about every 15 minutes on home Wi-Fi.' : ''}
      </Body>
      <Choice
        value={on ? 'on' : 'off'}
        onChange={change}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
      />
      {on ? (
        <>
          <Body muted>Chore updates for parents (“Ava finished 3 chores”):</Body>
          <Choice
            value={chores ? 'on' : 'off'}
            onChange={async (v) => {
              setChores(v === 'on');
              await setChoreUpdatesEnabled(services, v === 'on');
            }}
            options={[
              { value: 'on', label: 'Show' },
              { value: 'off', label: 'Mute' },
            ]}
          />
        </>
      ) : null}
      {blocked ? <Body muted>Notifications are blocked for Family Chores. Turn them on in Android Settings → Apps → Family Chores.</Body> : null}
    </Card>
  );
}
