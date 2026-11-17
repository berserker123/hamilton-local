import React, { useState } from 'react';
import { Rss } from 'lucide-react';
import CONFIG from './data/subscribe.json';
import { href } from './site-routes.mjs';
import { TOPICS, TopicId, SubscribeConfig, SubscribeResult, submitSubscription } from './subscribe-model';

type T = (zh: string, en: string) => string;

export function Subscribe({ t, variant = 'full', config = CONFIG as SubscribeConfig, submit = submitSubscription }: {
  t: T; variant?: 'full' | 'compact'; config?: SubscribeConfig; submit?: typeof submitSubscription;
}) {
  const [email, setEmail] = useState('');
  const [topics, setTopics] = useState<TopicId[]>(TOPICS.map(x => x.id));
  const [state, setState] = useState<SubscribeResult | 'idle' | 'sending' | 'notopic'>('idle');
  const id = 'subscribe-' + variant;
  const toggle = (topic: TopicId) => setTopics(cur => cur.includes(topic) ? cur.filter(x => x !== topic) : [...cur, topic]);
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === 'sending') return;
    if (!topics.length) { setState('notopic'); return; }
    setState('sending');
    setState(await submit(config, email, topics));
  }
  const message: Record<string, [string, string]> = {
    soon: ['订阅即将开放', 'Subscriptions opening soon'],
    ok: ['请查收确认邮件', 'Check your inbox to confirm'],
    error: ['提交失败，请稍后再试。', 'Something went wrong. Please try again later.'],
    invalid: ['请输入有效的邮箱地址。', 'Please enter a valid email address.'],
    notopic: ['请至少选择一项订阅内容。', 'Please choose at least one topic.'],
  };
  const msg = message[state];
  const isError = state === 'error' || state === 'invalid' || state === 'notopic';
  const title = t('订阅 Hamilton Local', 'Subscribe to Hamilton Local');
  return <section className={'hl-sub hl-sub--' + variant + (variant === 'full' ? ' sb-container' : '')} aria-labelledby={id + '-title'} data-testid="subscribe">
    <form className="hl-sub-card" onSubmit={onSubmit} noValidate aria-describedby={id + '-note'}>
      <div className="hl-sub-head">
        {variant === 'full' ? <h2 id={id + '-title'} className="hl-sub-title">{title}</h2> : <h3 id={id + '-title'} className="hl-sub-title">{title}</h3>}
        <a className="hl-sub-rss" href="/feed.xml"><Rss aria-hidden="true" /><span>{t('RSS 订阅', 'RSS feed')}</span></a>
      </div>
      <fieldset className="hl-sub-topics">
        <legend>{t('订阅内容', 'Topics')}</legend>
        {TOPICS.map(topic => <label key={topic.id} className="hl-sub-check">
          <input type="checkbox" name="topics" value={topic.id} checked={topics.includes(topic.id)} onChange={() => toggle(topic.id)} />
          <span>{t(topic.zh, topic.en)}</span>
        </label>)}
      </fieldset>
      <div className="hl-sub-row">
        <label className="hl-sub-label" htmlFor={id + '-email'}>{t('邮箱', 'Email')}</label>
        <input id={id + '-email'} className="hl-sub-input" type="email" name="email" required autoComplete="email" inputMode="email"
          value={email} onChange={e => setEmail(e.target.value)} aria-invalid={state === 'invalid'} aria-describedby={id + '-status'} placeholder="name@example.com" />
        <button type="submit" className="hl-sub-btn" disabled={state === 'sending'}>{t('订阅', 'Subscribe')}</button>
      </div>
      <p id={id + '-status'} className={'hl-sub-status' + (isError ? ' is-error' : '')} role={isError ? 'alert' : 'status'} aria-live="polite">{msg ? t(msg[0], msg[1]) : ''}</p>
      <p id={id + '-note'} className="hl-sub-note">{t('我们只用你的邮箱发送 Hamilton Local 内容，随时可退订。', 'We only use your email to send Hamilton Local content. Unsubscribe any time.')} <a href={href('privacy')}>{t('隐私政策', 'Privacy')}</a></p>
    </form>
  </section>;
}
