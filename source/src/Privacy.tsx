import React from 'react';
import { href } from './site-routes.mjs';

type T = (zh: string, en: string) => string;

export function Privacy({ t }: { t: T }) {
  return <>
    <div className="sb-container ia-page-intro">
      <div className="ia-breadcrumb"><a href={href('home')}>{t('首页', 'Home')}</a><span>/</span><span>{t('隐私政策', 'Privacy Policy')}</span></div>
      <h1 className="ia-page-title" tabIndex={-1}>{t('隐私政策', 'Privacy Policy')}</h1>
      <p className="ia-page-en">{t('Privacy Policy', '隐私政策')}</p>
      <div className="ia-intro-bottom"><p>{t('你的隐私，值得认真对待。', 'Your privacy deserves care.')}</p></div>
    </div>
    <div className="ia-content hl-privacy">
      <article className="sb-container" aria-label={t('隐私政策正文', 'Privacy policy details')}>
        <div className="hl-privacy-copy">
          <p className="ia-section-note">{t('最后更新：', 'Last updated: ')}<time dateTime="2026-11-16">{t('2026年11月16日', '16 November 2026')}</time></p>
          <section aria-labelledby="privacy-who"><h2 id="privacy-who">{t('我们是谁', 'Who we are')}</h2>
            <p>{t('Hamilton Local 是独立运营的新西兰汉密尔顿本地信息网站。本政策说明我们如何按照新西兰《2020年隐私法》（Privacy Act 2020）处理个人信息。', 'Hamilton Local is an independently run local information website for Hamilton, New Zealand. This policy explains how we handle personal information under New Zealand’s Privacy Act 2020.')}</p>
            <p>{t('隐私问题请联系：', 'For privacy questions, email: ')}<a href="mailto:adminhamiltonlocal@gmail.com">adminhamiltonlocal@gmail.com</a>{t('。', '.')}</p>
          </section>
          <section aria-labelledby="privacy-collect"><h2 id="privacy-collect">{t('我们收集什么、用来做什么', 'What we collect and why')}</h2>
            <ul>
              <li>{t('访问统计：我们通过 Cloudflare Web Analytics 了解匿名、汇总的访问情况与网页表现。据 Cloudflare 说明，这项分析不使用 Cookie，也不跨网站追踪个人。', 'Visit statistics: we use Cloudflare Web Analytics for anonymous, aggregate visit statistics and page performance. Cloudflare states that this analytics service does not use cookies or track individuals across sites.')} <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer">{t('了解这项服务', 'About this service')}</a>{t('。', '.')}</li>
              <li>{t('意见反馈：你自愿提交的反馈类型、内容，以及选填的称呼、邮箱或微信号，会连同当前页面网址和所在栏目通过 Web3Forms 发送给我们。表单也会发送反垃圾检查结果；如填写邮箱，会将其用作回复地址。我们仅用这些信息回复你和改进网站，不公开你的联系方式。', 'Feedback: the feedback type, message, optional name and email or WeChat ID you submit are sent to us through Web3Forms, together with the current page URL and section. The form also sends an anti-spam check result; an email contact is also used as the reply address. We use this information only to reply and improve the site, and do not publish your contact details.')}</li>
              <li>{t('来信：当你给我们发邮件时，我们会收到你的邮箱、邮件内容及你主动提供的其他信息，用于处理来信和回复。联系邮箱使用 Gmail；邮件也会由相关邮件服务商处理。', 'Emails: when you email us, we receive your email address, message and any other information you choose to include, to handle and reply to your enquiry. Our contact mailbox uses Gmail; the relevant email providers also process the email.')}</li>
            </ul>
          </section>
          <section aria-labelledby="privacy-technical"><h2 id="privacy-technical">{t('地图、网站运行与偏好设置', 'Maps, site delivery and preferences')}</h2>
            <p>{t('游乐场地图使用本站打包的 Leaflet 地图库，并从 OpenStreetMap 加载地图图块。打开或移动地图时，图块服务商会收到 IP 地址、所请求的地图区域等技术请求数据；我们不请求你的设备定位。', 'The playground map uses locally bundled Leaflet and loads map tiles from OpenStreetMap. Opening or moving the map sends technical request data, such as your IP address and the requested map area, to the tile provider. We do not request your device location.')}</p>
            <p>{t('网站通过 GitHub Pages 和 Cloudflare 提供服务。为传送网页和保障安全，这些服务可能处理 IP 地址、浏览器信息等标准技术数据。第三方服务可能在新西兰境外处理数据。', 'The site is delivered through GitHub Pages and Cloudflare. These services may process standard technical data, such as IP addresses and browser information, to deliver and secure the site. Third-party services may process data outside New Zealand.')}</p>
            <p>{t('我们用浏览器本地存储记住你选择的语言和日间／夜间主题，不用于广告追踪。网站图片由本站提供，字体使用浏览器可用字体；没有嵌入第三方视频或社交组件。', 'We use browser local storage to remember your language and day/night theme, without advertising tracking. Images are served by this site and fonts use those available in your browser. We do not embed third-party videos or social widgets.')}</p>
          </section>
          <section aria-labelledby="privacy-promises"><h2 id="privacy-promises">{t('我们的承诺', 'Our commitments')}</h2>
            <p>{t('我们不出售或出租个人信息，也不进行广告追踪。商家列表信息仅在获得商家同意后发布。', 'We do not sell or rent personal information, or use advertising tracking. Merchant listing information is published only with the merchant’s consent.')}</p>
          </section>
          <section aria-labelledby="privacy-links"><h2 id="privacy-links">{t('外部链接', 'External links')}</h2>
            <p>{t('商家、活动、零售商、Google Maps 及其他外部链接会带你前往其他网站。这些网站有自己的隐私政策；请在提供信息前查看。', 'Business, event, retailer, Google Maps and other external links take you to other websites. Those sites have their own privacy policies; please check them before sharing information.')}</p>
          </section>
          <section aria-labelledby="privacy-rights"><h2 id="privacy-rights">{t('你的选择与权利', 'Your choices and rights')}</h2>
            <p>{t('你可以来信要求访问、更正我们持有的个人信息，也可以请求删除。我们会按适用法律处理你的请求。如对隐私处理有疑虑，请先联系我们；若未能解决，你可以向新西兰隐私专员办公室投诉：', 'You can email us to request access to or correction of personal information we hold about you, or ask us to delete it. We will handle your request under applicable law. Please contact us first with any privacy concern. If it remains unresolved, you can complain to the New Zealand Office of the Privacy Commissioner: ')}<a href="https://www.privacy.org.nz/" target="_blank" rel="noopener noreferrer">privacy.org.nz</a>{t('。', '.')}</p>
          </section>
          <section aria-labelledby="privacy-changes"><h2 id="privacy-changes">{t('政策更新', 'Changes to this policy')}</h2>
            <p>{t('我们可能更新本页，以反映网站或隐私处理方式的变化。最新版本及更新日期会显示在本页。', 'We may update this page as the site or our privacy practices change. The current version and last updated date will appear here.')}</p>
          </section>
        </div>
      </article>
    </div>
  </>;
}
