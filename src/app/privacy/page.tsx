import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { clinic } from "@/config/clinic";

export const metadata: Metadata = {
  title: "Website Privacy Notice",
  description: "How the Tanvi Dental Care & Implant Centre website handles technical data, external links and contact choices.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="privacy-page">
        <section className="catalogue-page-hero">
          <div className="container">
            <p className="eyebrow">Website information</p>
            <h1>Privacy Notice</h1>
            <p>This notice explains the current data-handling features of the public website at tanvidental.in.</p>
          </div>
        </section>

        <section className="privacy-content">
          <article className="container privacy-article">
            <p className="privacy-updated"><strong>Last updated:</strong> 20 September 2026</p>

            <h2>Information submitted through this website</h2>
            <p>The public website does not currently provide an appointment form, patient portal or online payment form. It does not ask you to enter health information directly into a website form.</p>

            <h2>Calling, WhatsApp and external services</h2>
            <p>The website provides links that let you call the clinic, open WhatsApp, open Google Maps or visit its Instagram profile. Selecting a link opens the relevant external service, which handles information under its own privacy terms. Google Maps also loads automatically in the location section, as explained below.</p>
            <p>A WhatsApp link may open a pre-filled general enquiry. Review the message before sending it and avoid including sensitive health or identification information unless the clinic has asked for it through an appropriate channel.</p>

            <h2>Technical information</h2>
            <p>The website hosting provider may process standard request and security information needed to deliver and protect the site. This can include an internet protocol address, browser or device information, requested page, request time and diagnostic or security logs.</p>

            <h2>Cookies and analytics</h2>
            <p>The site does not currently add Google Analytics or advertising tracking code. Embedded Google Maps may use Google cookies or similar technologies, subject to your browser and Google account settings. The staff-only admin tools use an essential, secure sign-in cookie after an authorised editor signs in. That cookie supports the admin session and expires after up to 12 hours.</p>

            <h2>Embedded content and fonts</h2>
            <p>The website loads DM Sans and Playfair Display from Google Fonts automatically. The homepage location section also loads an embedded Google Map automatically as you approach it. These requests send Google technical information such as your IP address, browser or device information and request details; the map may also receive the website origin. This happens without selecting an external link. Google processes this information under its <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. Your browser settings can restrict third-party content or cookies, although the fonts or map may then be unavailable.</p>

            <h2>Staff content tools</h2>
            <p>Authorised staff can use Content OS to prepare clinic information. When these tools are used, clinic planning inputs, drafts and image instructions are sent to OpenAI for generation or review. Staff must not include patient-identifying details, private health records or confidential information.</p>
            <p>Saved draft text and images are stored in the clinic website’s public GitHub repository. They can be publicly visible there before an article is published on the website. Staff should save only material suitable for public access and confirm that they have the necessary rights to use it.</p>

            <h2>Dental information</h2>
            <p>Website articles and treatment pages provide general education. They are not a diagnosis and are not a substitute for an examination by a qualified dentist.</p>

            <h2>Questions about this notice</h2>
            <p>For a question about this website notice, contact Tanvi Dental Care &amp; Implant Centre by phone at <a href={clinic.phoneHref}>{clinic.phone}</a>. Please do not send confidential patient records as part of a general website enquiry.</p>

            <h2>Changes</h2>
            <p>This notice may be updated when the website changes. The date above identifies the version currently published.</p>

            <p className="privacy-back"><Link href="/">Return to the homepage</Link></p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
