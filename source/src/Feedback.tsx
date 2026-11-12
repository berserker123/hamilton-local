import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Check, MessageSquare, Send, X } from 'lucide-react';
import { deliverFeedback, feedbackMailto, FEEDBACK_TYPES, FeedbackContext, FeedbackDraft, FeedbackErrors, isPreviewFeedback, validateFeedback } from './feedback-model';

type Lang = 'zh' | 'en';
type FeedbackRequest = FeedbackContext & { type: string; message?: string };
type FeedbackService = { lang: Lang; open: (section?: string, origin?: HTMLElement, type?: string, message?: string) => void };
const FeedbackServiceContext = createContext<FeedbackService | null>(null);
export const useFeedback = () => useContext(FeedbackServiceContext)!;

export function FeedbackProvider({ lang, section, children }: { lang: Lang; section: string; children: React.ReactNode }) {
  const [request, setRequest] = useState<FeedbackRequest | null>(null);
  const origin = useRef<HTMLElement | null>(null);
  const open = useCallback((detail?: string, element?: HTMLElement, type = 'correction', message?: string) => {
    origin.current = element ?? document.activeElement as HTMLElement;
    setRequest({ url: location.href, section: detail ? section + ' · ' + detail : section, type, message });
  }, [section]);
  const close = useCallback(() => {
    setRequest(null);
    const element = origin.current;
    requestAnimationFrame(() => { if (element?.isConnected) element.focus({ preventScroll: true }); });
  }, []);
  useEffect(() => {
    const leave = () => setRequest(null);
    window.addEventListener('hashchange', leave);
    return () => window.removeEventListener('hashchange', leave);
  }, []);
  return <FeedbackServiceContext.Provider value={{ lang, open }}>{children}{request && createPortal(<FeedbackDialog lang={lang} context={request} close={close} />, document.body)}</FeedbackServiceContext.Provider>;
}

export function FeedbackLink({ section }: { section?: string }) {
  const { lang, open } = useFeedback();
  return <button type="button" className="fb-detail-link" onClick={e => open(section, e.currentTarget)} aria-haspopup="dialog">{lang === 'zh' ? '发现信息有误？告诉我们' : 'Something incorrect? Let us know'}<ArrowUpRight aria-hidden="true" /></button>;
}

export function FeedbackFooter() {
  const { lang, open } = useFeedback();
  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  return <section className="fb-footer" aria-labelledby="fb-footer-title">
    <span className="fb-footer-icon"><MessageSquare aria-hidden="true" /></span>
    <div><span className="fb-eyebrow">BETTER TOGETHER · HAMILTON LOCAL</span><h2 id="fb-footer-title">{t('这份指南，也有你的一份。', 'Help shape your local guide.')}</h2><p>{t('发现信息有误，或有值得分享的本地推荐？告诉我们，一起把这里做得更好。', 'Spotted a mistake or found a local favourite? Share it and help make this guide more useful.')}</p></div>
    <button className="fb-footer-button" type="button" aria-haspopup="dialog" onClick={e => open('Footer', e.currentTarget)}>{t('意见反馈', 'Feedback')}<ArrowUpRight aria-hidden="true" /></button>
  </section>;
}

export function FeedbackLauncher() {
  const { lang, open } = useFeedback();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let frame = 0;
    const position = () => {
      frame = 0;
      const el = button.current;
      if (!el) return;
      const mobile = innerWidth <= 600;
      const gap = mobile ? 16 : 24;
      // Keep the fixed launcher clear of controls as the map/weather scroll past it.
      el.style.right = `max(${gap}px, env(safe-area-inset-right))`;
      el.style.bottom = `max(${gap}px, env(safe-area-inset-bottom))`;
      const bounds = el.getBoundingClientRect();
      const blockers = Array.from(document.querySelectorAll<HTMLElement>('.v20-cord, .leaflet-control, .ia-weather, .v22-result, .sb-hero-location, .v22-scene-label, .ia-place-actions, .pg-place-actions, .ia-market-actions'))
        .map(node => {
          const rect = node.getBoundingClientRect();
          const box = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
          // Scrolled-out cards have client rectangles beyond their scroll container.
          // Only the visible intersection may move the launcher.
          for (let parent = node.parentElement; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
            if (/auto|scroll|hidden|clip/.test(style.overflowX)) { box.left = Math.max(box.left, clip.left); box.right = Math.min(box.right, clip.right); }
            if (/auto|scroll|hidden|clip/.test(style.overflowY)) { box.top = Math.max(box.top, clip.top); box.bottom = Math.min(box.bottom, clip.bottom); }
          }
          box.width = Math.max(0, box.right - box.left); box.height = Math.max(0, box.bottom - box.top);
          return { box, control: node.matches('.v20-cord, .leaflet-control, .ia-weather') };
        })
        .filter(({ box }) => box.width && box.height && box.bottom > 0 && box.top < innerHeight);
      const xs = [...new Set([bounds.left, ...blockers.flatMap(({ box }) => [box.left - bounds.width - 12, box.right + 12])])]
        .filter(x => x >= gap && x <= bounds.left).sort((a, b) => b - a);
      const ys = [...new Set([bounds.top, ...blockers.flatMap(({ box }) => [box.top - bounds.height - 12, box.bottom + 12])])]
        .filter(y => y >= gap && y <= bounds.top).sort((a, b) => b - a);
      const candidates = xs.flatMap(x => ys.map(y => ({ x, y })));
      const findSpace = (controlsOnly: boolean) => candidates.find(({ x, y }) => blockers.every(({ box, control }) =>
        (controlsOnly && !control) || box.left >= x + bounds.width + 12 || box.right <= x - 12 || box.top >= y + bounds.height + 12 || box.bottom <= y - 12));
      // On very small screens, controls take priority over decorative labels/cards.
      const place = findSpace(false) ?? findSpace(true) ?? { x: bounds.left, y: bounds.top };
      el.style.right = `${innerWidth - place.x - bounds.width}px`;
      el.style.bottom = `${innerHeight - place.y - bounds.height}px`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(position); };
    position();
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    const observer = new MutationObserver(schedule);
    // Scene/language changes can wrap an existing text node into a taller label.
    observer.observe(document.getElementById('root')!, { childList: true, characterData: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule); window.removeEventListener('hashchange', schedule); };
  }, []);
  return <button ref={button} className="fb-launcher" data-testid="feedback-launcher" type="button" aria-haspopup="dialog" aria-label={lang === 'zh' ? '意见反馈' : 'Feedback'} onClick={e => open(undefined, e.currentTarget)}><MessageSquare aria-hidden="true" /><span>{lang === 'zh' ? '意见反馈' : 'Feedback'}</span></button>;
}

function FeedbackDialog({ lang, context, close }: { lang: Lang; context: FeedbackRequest; close: () => void }) {
  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<FeedbackDraft>({ type: context.type, message: context.message ?? '', name: '', contact: '', botcheck: '' });
  const [errors, setErrors] = useState<FeedbackErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'email' | 'error'>('idle');
  const busy = useRef(false);
  const controller = useRef<AbortController>();
  const statusHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = innerWidth - document.documentElement.clientWidth;
    if (scrollbar) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = 'hidden';
    element.showModal();
    if (context.message) {
      const message = element.querySelector<HTMLTextAreaElement>('#fb-message');
      message?.focus({ preventScroll: true });
      message?.setSelectionRange(message.value.length, message.value.length);
    } else element.querySelector<HTMLInputElement>('input[name="type"]:checked')?.focus({ preventScroll: true });
    return () => { controller.current?.abort(); element.close(); document.body.style.overflow = overflow; document.body.style.paddingRight = padding; };
  }, []);
  useEffect(() => { if (status === 'sent' || status === 'email' || status === 'error') statusHeading.current?.focus(); }, [status]);
  const update = (field: keyof FeedbackDraft, value: string) => {
    setDraft(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    if (status === 'error') setStatus('idle');
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const next = validateFeedback(draft);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { dialog.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    busy.current = true;
    setStatus('loading');
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 15000);
    try {
      const result = await deliverFeedback(draft, context, lang, { signal: controller.current.signal });
      setStatus(result === 'email' ? 'email' : 'sent');
    } catch { if (dialog.current?.isConnected) setStatus('error'); }
    finally { clearTimeout(timeout); busy.current = false; }
  }
  const errorText = (field: keyof FeedbackErrors) => ({
    type: t('请选择反馈类型。', 'Choose a feedback type.'),
    message: t('请输入 5–1000 个字符（不能全为空格）。', 'Enter 5–1000 characters, with at least 5 non-padding characters.'),
    name: t('姓名请控制在 80 个字符以内。', 'Keep your name within 80 characters.'),
    contact: t('请输入有效邮箱或微信号，最多 120 个字符。', 'Enter a valid email or WeChat ID, up to 120 characters.'),
  }[field]);
  const error = (field: keyof FeedbackErrors) => errors[field] && <p id={`fb-${field}-error`} className="fb-field-error" role="alert">{errorText(field)}</p>;
  const complete = status === 'sent' || status === 'email';
  return <dialog ref={dialog} className="fb-dialog" lang={lang === 'zh' ? 'zh-CN' : 'en-NZ'} aria-labelledby="fb-title" aria-describedby="fb-intro" onCancel={e => { e.preventDefault(); close(); }} onClick={e => {
    if (e.target !== e.currentTarget) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) close();
  }} onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const controls = Array.from(dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]), textarea:not(:disabled)')).filter(node => node.getClientRects().length && (node.getAttribute('type') !== 'radio' || (node as HTMLInputElement).checked));
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) { e.preventDefault(); first?.focus(); }
  }}>
    <div className="fb-dialog-heading"><span className="fb-eyebrow"><MessageSquare aria-hidden="true" />HAMILTON LOCAL</span><button type="button" className="fb-close" aria-label={t('关闭反馈', 'Close feedback')} onClick={close}><X aria-hidden="true" /></button></div>
    <h2 id="fb-title">{t('意见反馈', 'Feedback')}</h2><p id="fb-intro">{t('你的一点发现，让本地生活更顺手。', 'Your local knowledge makes this guide better.')}</p>
    {complete ? <div className="fb-complete" role="status"><span className="fb-success-icon"><Check aria-hidden="true" /></span><h3 ref={statusHeading} tabIndex={-1}>{status === 'sent' ? t('收到，谢谢你的反馈。', 'Received. Thanks for helping.') : t('请在邮件应用中完成发送', 'Finish sending in your email app')}</h3><p>{status === 'sent' ? t('我们会认真阅读，一起完善这份本地指南。', 'We’ll read your feedback and use it to improve the guide.') : t('已尝试打开预填邮件；反馈尚未发送。若邮件应用未打开，可点下方链接重试。', 'We tried to open a prefilled email. Your feedback has not been sent yet. Use the link below if your email app did not open.')}</p>{status === 'email' && <a className="fb-submit" href={feedbackMailto(draft, context, lang)}>{t('打开反馈邮件', 'Open feedback email')}<ArrowUpRight aria-hidden="true" /></a>}<button className={status === 'sent' ? 'fb-submit' : 'fb-secondary'} type="button" onClick={status === 'sent' ? close : () => setStatus('idle')}>{status === 'sent' ? t('完成', 'Done') : t('返回编辑', 'Back to edit')}</button></div> : <form noValidate onSubmit={submit} aria-busy={status === 'loading'}>
      {isPreviewFeedback && <p className="fb-preview" data-testid="feedback-preview">{t('预览模式 · 在线提交尚未启用。提交将打开预填邮件，收件人 hello@hamiltonlocal.nz；请在邮件应用中发送。', 'Preview mode · Online submission is not enabled. Submit opens a prefilled email to hello@hamiltonlocal.nz; send it from your email app.')}</p>}
      {status === 'error' && <div className="fb-error" role="alert"><h3 ref={statusHeading} tabIndex={-1}>{t('暂时未能发送，请重试。', 'Could not send. Please try again.')}</h3><p>{t('内容已保留，也可以通过邮件联系我们。', 'Your message is preserved. You can also send it by email.')} <a href={feedbackMailto(draft, context, lang)}>{t('改用邮件', 'Use email')}</a></p></div>}
      <fieldset className="fb-fields" disabled={status === 'loading'}>
        <fieldset className="fb-types" aria-describedby={errors.type ? 'fb-type-error' : undefined}><legend>{t('反馈类型', 'Feedback type')}</legend><div className="fb-chips">{FEEDBACK_TYPES.map(type => <label key={type.id} className="fb-chip"><input type="radio" name="type" value={type.id} checked={draft.type === type.id} onChange={() => update('type', type.id)} /><span>{type[lang]}</span></label>)}</div>{error('type')}</fieldset>
        <div className="fb-field"><label htmlFor="fb-message">{t('想告诉我们什么？', 'What would you like to share?')} <span>{t('必填', 'Required')}</span></label><textarea id="fb-message" name="message" required minLength={5} maxLength={1000} rows={4} value={draft.message} onChange={e => update('message', e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={'fb-message-hint fb-counter' + (errors.message ? ' fb-message-error' : '')} placeholder={t('哪里需要更新？也欢迎分享你的想法或本地推荐。', 'What needs updating? Ideas and local recommendations are welcome too.')} /><div className="fb-message-meta"><span id="fb-message-hint">{t('5–1000 个字符', '5–1000 characters')}</span><span id="fb-counter" role="status" aria-live="off">{draft.message.length} / 1000</span></div>{error('message')}</div>
        <div className="fb-optional"><div className="fb-field"><label htmlFor="fb-name">{t('称呼', 'Name')} <span>{t('选填', 'Optional')}</span></label><input id="fb-name" name="name" autoComplete="name" maxLength={80} value={draft.name} onChange={e => update('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'fb-name-error' : undefined} placeholder={t('怎么称呼你', 'What should we call you?')} />{error('name')}</div><div className="fb-field"><label htmlFor="fb-contact">{t('邮箱或微信', 'Email or WeChat')} <span>{t('选填', 'Optional')}</span></label><input id="fb-contact" name="contact" autoComplete="off" maxLength={120} value={draft.contact} onChange={e => update('contact', e.target.value)} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? 'fb-contact-error' : undefined} placeholder={t('方便我们与你联系', 'So we can get back to you')} />{error('contact')}</div></div>
        <input type="hidden" name="page_url" value={context.url} /><input type="hidden" name="section" value={context.section} />
        <div className="fb-honeypot" aria-hidden="true"><label>Leave this field empty<input name="botcheck" tabIndex={-1} autoComplete="off" value={draft.botcheck} onChange={e => update('botcheck', e.target.value)} /></label></div>
        <button className="fb-submit" type="submit">{status === 'loading' ? t('正在发送…', 'Sending…') : isPreviewFeedback ? t('用邮件发送反馈', 'Send feedback by email') : t('发送反馈', 'Send feedback')}<Send aria-hidden="true" /></button>
      </fieldset>
    </form>}
    <p className="fb-privacy">{t('仅用于改进网站，不会公开你的联系方式。', 'Only used to improve the website. Your contact details will not be made public.')}</p>
  </dialog>;
}
