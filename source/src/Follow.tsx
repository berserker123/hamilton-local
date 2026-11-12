import React from 'react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { EMAIL_FIELD_NAME, emailSubscribeEndpoint, xiaohongshuUrl } from './follow-config.mjs';

type T = (zh: string, en: string) => string;

export function FollowBlock({ t, variant = 'home' }: { t: T; variant?: 'home' | 'footer' }) {
  const xhs = xiaohongshuUrl();
  const endpoint = emailSubscribeEndpoint();
  const compact = variant === 'footer';
  const titleId = compact ? 'follow-footer-title' : 'follow-title';
  const emailId = compact ? 'follow-email-footer' : 'follow-email';
  return <section className={'hl-follow' + (compact ? ' hl-follow--footer' : ' sb-container')} id={compact ? 'follow-footer' : 'follow'} aria-labelledby={titleId} data-testid={compact ? 'follow-footer' : 'follow-home'}>
    <div className="hl-follow-card">
      <div className="hl-follow-copy">
        <p className="hl-follow-kicker">{t('小红书 · 邮件', 'XIAOHONGSHU · EMAIL')}</p>
        <h2 id={titleId}>{t('把日子，慢慢读下去。', 'Stay a little closer to Hamilton.')}</h2>
        <p>{t('在小红书看本地生活笔记，或留下邮箱，接收这份指南的更新。', 'Follow local notes on Xiaohongshu, or leave an email for updates to this guide.')}</p>
        {!xhs && !endpoint ? <p className="hl-follow-pending">{t('关注与订阅方式即将公布。', 'Follow and subscribe links will appear here.')}</p> : null}
      </div>
      {(xhs || endpoint) && <div className="hl-follow-actions">
        {xhs ? <a className="hl-follow-xhs" href={xhs} target="_blank" rel="noopener noreferrer">{t('在小红书关注', 'Follow on Xiaohongshu')}<ArrowUpRight aria-hidden="true" /></a> : null}
        {endpoint ? <form className="hl-follow-form" action={endpoint} method="post">
          <label htmlFor={emailId}>{t('邮箱订阅', 'Email updates')}</label>
          <div className="hl-follow-row">
            <Mail aria-hidden="true" />
            <input id={emailId} type="email" name={EMAIL_FIELD_NAME} required autoComplete="email" inputMode="email" placeholder="you@example.com" />
            <button type="submit">{t('订阅', 'Subscribe')}</button>
          </div>
        </form> : null}
        {xhs && !endpoint ? <p className="hl-follow-pending">{t('邮件订阅尚未开放。', 'Email updates are not open yet.')}</p> : null}
      </div>}
    </div>
  </section>;
}
