import Layout from "@/components/layout/Layout";
import { site } from "@/config/site";

const link = "font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4";

const Block = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section aria-labelledby={id} className="border-t border-border py-8">
    <h2 id={id} className="font-display text-2xl font-bold">{title}</h2>
    <div className="mt-3 max-w-prose space-y-3 leading-relaxed">{children}</div>
  </section>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);

const Privacy = () => {
  const contact = site.contactEmail
    ? <a href={`mailto:${site.contactEmail}`} className={link}>{site.contactEmail}</a>
    : <span className="font-medium">the contact details that will be added here</span>;

  return (
    <Layout>
      <div className="container-custom grid gap-12 py-14 md:grid-cols-12">
        <header className="md:col-span-4">
          <h1 className="display-condensed font-display text-6xl font-extrabold leading-none tracking-tight md:text-7xl">Privacy notice</h1>
          <p className="mt-4 max-w-xs text-muted-foreground">What we collect, why, and what you can ask us to do about it.</p>
          <p className="mt-6 font-mono text-sm text-muted-foreground">Updated {site.privacyUpdated}</p>
        </header>

        <div className="md:col-span-8">
          <Block id="who" title="Who we are">
            <p>CivicLens is an independent project run by {site.operator}. It collects public documents and figures from official Nigerian sources and makes them easier to search. We are responsible for the personal information described here, under the Nigeria Data Protection Act 2023.</p>
            <p>Contact us about anything in this notice at {contact}.</p>
          </Block>

          <Block id="collect" title="What we collect, and why">
            <p><strong>If you sign up for alerts:</strong> your email address, the document types you choose, and any keywords you add. We use them to email you when new documents match. We do this because you agreed when you signed up.</p>
            <p><strong>If you ask a question</strong> about a document, or use AI Search: your question and the last few messages in that conversation, along with the name of the document. We use them to write an answer. Please do not type personal details, such as phone numbers or ID numbers, into these boxes.</p>
            <p><strong>When you browse:</strong> our hosting provider keeps standard server logs, which can include your IP address and the pages you ask for. We use them to keep the site running and secure.</p>
            <p>Searching and filtering documents happens in your browser and is not saved on our side. We do not use advertising or analytics cookies.</p>
          </Block>

          <Block id="share" title="Who else sees it">
            <p>We do not sell your information. To run the site we use:</p>
            <List items={[
              "Hosting and database providers that store alert sign-ups and run our automation.",
              "AI services that read your question and the relevant document text to produce an answer or summary.",
              "Google Fonts, which loads our typefaces. Your browser contacts Google to fetch them, so Google can see your IP address.",
            ]} />
            <p>Some of these providers may store data outside Nigeria. We choose providers that protect it, and we share only what each one needs.</p>
          </Block>

          <Block id="keep" title="How long we keep it">
            <p>We keep your alert details until you ask us to remove them. Questions sent to the AI are used to answer you and are not used to build profiles of you.</p>
          </Block>

          <Block id="rights" title="Your rights">
            <p>You can ask us to:</p>
            <List items={[
              "tell you what we hold about you, and give you a copy",
              "correct anything that is wrong",
              "delete your information, or stop using it",
              "stop sending alerts, at any time",
              "move your information to another service",
            ]} />
            <p>Write to {contact} from the email address you signed up with, and we will deal with your request. If you are not happy with how we handle it, you can complain to the Nigeria Data Protection Commission.</p>
          </Block>

          <Block id="changes" title="Changes">
            <p>If we change this notice in a way that matters, we will update the date at the top of this page.</p>
          </Block>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
