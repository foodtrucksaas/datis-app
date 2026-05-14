import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";

export default function LegalPage() {
  return (
    <>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Wordmark size="sm" />
      </header>

      <main className="mx-auto max-w-2xl flex-1 px-5 py-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Mentions légales
        </h1>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Nature du service
            </h2>
            <p>
              ATIS.live est un service d&apos;agrégation et de présentation de
              messages D-ATIS (Digital Automatic Terminal Information Service)
              reçus via le réseau communautaire ACARS, opéré par airframes.io.
              Ce service a une vocation strictement informative.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Source des données
            </h2>
            <p>
              Les données affichées proviennent de réceptions ACARS
              communautaires (réseau de feeders airframes.io). Ces données sont
              captées par des stations au sol non certifiées, puis transmises
              via Internet. Elles ne proviennent pas d&apos;une source officielle
              de navigation aérienne.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Limitations
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Les données peuvent être obsolètes, incomplètes, erronées ou
                absentes.
              </li>
              <li>
                La couverture géographique dépend de la disponibilité des
                stations de réception et n&apos;est pas garantie.
              </li>
              <li>
                Le délai entre l&apos;émission d&apos;un message et son affichage sur
                ce service peut varier significativement.
              </li>
              <li>
                Aucun processus de vérification automatisé ne garantit
                l&apos;intégrité ou l&apos;exactitude des données.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Usage strictement informatif
            </h2>
            <p>
              Ce service ne doit en aucun cas être utilisé en cadre
              opérationnel. Il ne remplace pas les sources officielles de
              données aéronautiques, notamment : le D-ATIS reçu en cockpit via
              datalink (ARINC / SITA), l&apos;ATIS voix VHF, les briefings et
              systèmes opérationnels de la compagnie aérienne, les publications
              aéronautiques officielles (AIP, NOTAM).
            </p>
            <p className="mt-2">
              Pour la préparation et la conduite de vol, consultez
              exclusivement les sources officielles.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Limitation de responsabilité
            </h2>
            <p>
              L&apos;éditeur de ce service décline toute responsabilité quant à
              l&apos;utilisation des données présentées. L&apos;utilisateur est seul
              responsable de l&apos;usage qu&apos;il fait des informations affichées
              et des décisions qu&apos;il prend sur cette base.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Cette section sera complétée par un conseil juridique.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text-primary)]">
              Contact
            </h2>
            <p className="text-[var(--text-muted)]">
              contact@atis.eu (à configurer)
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
