import React, { useEffect, useRef, useState } from 'react';
import { clickTogglesFlip, keyTogglesFlip, toggleFlip } from './photo-flip';

export function PhotoFlip({ src, alt, author, license, licenseUrl, sourceUrl, showLabel, hideLabel, authorLabel, licenseLabel, sourceLabel, children }: {
  src: string;
  alt: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  showLabel: string;
  hideLabel: string;
  authorLabel: string;
  licenseLabel: string;
  sourceLabel: string;
  children?: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const front = root.querySelector('.ia-flip-front');
    const back = root.querySelector('.ia-flip-back');
    front?.toggleAttribute('inert', flipped);
    back?.toggleAttribute('inert', !flipped);
    if (!moved.current) return;
    root.querySelector<HTMLElement>(flipped ? '.ia-flip-back-hit' : '.ia-flip-front')?.focus();
  }, [flipped]);
  function onClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target;
    const onLink = target instanceof Element && !!target.closest('a');
    if (!clickTogglesFlip(onLink)) {
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    moved.current = true;
    setFlipped(current => toggleFlip(current));
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!keyTogglesFlip(event.key)) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a')) return;
    event.stopPropagation();
  }
  return <figure className="ia-place-figure">
    <div ref={rootRef} className={'ia-flip ia-place-photo' + (flipped ? ' is-flipped' : '')} data-flipped={flipped ? 'true' : 'false'} onClick={onClick} onKeyDown={onKeyDown}>
      <button type="button" className="ia-flip-front" aria-pressed={flipped} aria-hidden={flipped || undefined} aria-label={showLabel} tabIndex={flipped ? -1 : 0}>
        <img src={src} alt={alt} loading="lazy" />
        {children}
        <span className="ia-flip-hint" aria-hidden="true">i</span>
      </button>
      <div className="ia-flip-back" aria-hidden={flipped ? undefined : true}>
        <button type="button" className="ia-flip-back-hit" aria-label={hideLabel} tabIndex={flipped ? 0 : -1} />
        <div className="ia-flip-copy">
          {author && <p><span className="ia-flip-kicker">{authorLabel}</span>{author}</p>}
          {license && <p><span className="ia-flip-kicker">{licenseLabel}</span>{licenseUrl ? <a href={licenseUrl} target="_blank" rel="noopener noreferrer">{license}</a> : license}</p>}
          {sourceUrl && <p><a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel}</a></p>}
        </div>
      </div>
    </div>
  </figure>;
}
