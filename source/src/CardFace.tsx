import React from 'react';
import { Baby, BedDouble, Cherry, MapPin, PartyPopper, PawPrint, Store, Ticket, Trees } from 'lucide-react';
import { CardKind } from './card-style';

const KIND_ICON: Record<CardKind, typeof Trees> = {
  place: Trees,
  market: Store,
  stay: BedDouble,
  pet: PawPrint,
  upick: Cherry,
  playground: Trees,
  event: Ticket,
  party: PartyPopper,
};

const QUICK_ICON: Record<string, typeof MapPin> = {
  area: MapPin,
  km: MapPin,
  price: Ticket,
  tag: Ticket,
  age: Baby,
  season: Cherry,
  fruit: Cherry,
};

export function CardMedia({ kind, title, chips }: { kind: CardKind; title: string; chips?: string[] }) {
  const Icon = KIND_ICON[kind];
  return <div className="v25b-media" data-kind={kind} aria-hidden="true">
    <span className="v25b-media-icon"><Icon /></span>
    <strong className="v25b-media-title">{title}</strong>
    {!!chips?.length && <span className="v25b-chips">{chips.map(chip => <span className="v25b-chip" key={chip}>{chip}</span>)}</span>}
  </div>;
}

export function CardBadge({ kind }: { kind: CardKind }) {
  const Icon = KIND_ICON[kind];
  return <span className="v25b-badge" data-kind={kind} aria-hidden="true"><Icon /></span>;
}

export function CardQuick({ items }: { items: { key: string; text: string }[] }) {
  if (!items.length) return null;
  return <p className="v25b-quick">{items.map(item => {
    const Icon = QUICK_ICON[item.key] || MapPin;
    return <span key={item.key + item.text}><Icon aria-hidden="true" /><span>{item.text}</span></span>;
  })}</p>;
}
