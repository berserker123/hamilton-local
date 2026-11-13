import React, { useRef, useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
type T=(zh:string,en:string)=>string;
const EMAIL='adminhamiltonlocal@gmail.com';
export function ContactCard({t}:{t:T}) {
  const [status,setStatus]=useState<'idle'|'copied'|'failed'>('idle');
  const link=useRef<HTMLAnchorElement>(null);
  async function copy(){
    try{await navigator.clipboard.writeText(EMAIL);setStatus('copied');}
    catch{setStatus('failed');const range=document.createRange();if(link.current){range.selectNodeContents(link.current);const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);}}
  }
  return <section className="v17-contact" aria-labelledby="contact-title">
    <div className="v17-contact-copy"><h2 id="contact-title" className="heading-4">{t('让本地生活，多一点连接。','A little more connection, locally.')}</h2><p className="ia-secondary-name">{t('A little more connection, locally.', '让本地生活，多一点连接。')}</p><p className="body-6">{t('信息纠错、分享好去处，或聊聊商家合作。我们期待你的来信。','Corrections, local discoveries or business enquiries. We would love to hear from you.')}</p></div>
    <div className="v17-contact-actions"><span className="caption-3">{t('联系我们 / 商家合作','Contact / Business enquiries')}</span><a ref={link} className="v17-email title-2" href={'mailto:'+EMAIL}>{EMAIL}<ArrowUpRight aria-hidden="true" /></a><button type="button" className="v17-copy button-sm" onClick={copy}>{status==='copied'?<Check aria-hidden="true"/>:<Copy aria-hidden="true"/>}{t(status==='copied'?'邮箱已复制':'复制邮箱',status==='copied'?'Email copied':'Copy email')}</button><p className="caption-5 v17-copy-status" role="status">{status==='failed'?t('已选中邮箱，请长按或使用 Ctrl+C 复制。','Email selected. Long press or use Ctrl+C to copy.'):status==='copied'?t('随时写信，一起完善这份本地指南。','Drop us a line and help improve the guide.'):' '}</p></div>
  </section>;
}
