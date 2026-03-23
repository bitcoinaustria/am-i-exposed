"use client";

import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CopyButton } from "@/components/ui/CopyButton";
import { useTranslation } from "react-i18next";
import { CORS_SNIPPET, TOC_ITEMS } from "./setup-guide-data";
import { TroubleshootingSection } from "./TroubleshootingSection";
import {
  UmbrelSection,
  UmbrelManualSection,
  Start9Section,
  DockerSection,
  CorsProxySection,
} from "./PlatformSections";

export default function SetupGuidePage() {
  const { t } = useTranslation();

  return (
    <PageShell backLabel={t("setup.back", { defaultValue: "Back to scanner" })}>
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t("setup.title", { defaultValue: "Connect Your Node" })}
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-2xl">
            {t("setup.subtitle", { defaultValue: "Point am-i.exposed at your own mempool instance for maximum privacy. This guide covers Umbrel, Start9, Docker, and bare-metal setups." })}
          </p>
        </div>

        {/* Table of contents */}
        <nav className="flex flex-wrap gap-2 text-xs" aria-label={t("setup.tocLabel", { defaultValue: "Page sections" })}>
          {TOC_ITEMS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-2.5 py-2.5 rounded-lg bg-surface-elevated/50 border border-card-border/50 text-muted hover:text-foreground hover:border-bitcoin/30 transition-all"
            >
              {t(s.labelKey, { defaultValue: s.labelDefault })}
            </a>
          ))}
        </nav>

        {/* Why self-host */}
        <section id="why" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("setup.why_title", { defaultValue: "Why Self-Host?" })}
          </h2>
          <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
            <p className="text-muted leading-relaxed">
              {t("setup.why_p1", { defaultValue: "When you use the public mempool.space API, their servers see your IP address and every address and transaction you query. This creates a log linking your network identity to your Bitcoin activity." })}
            </p>
            <p className="text-muted leading-relaxed">
              {t("setup.why_p2", { defaultValue: "By pointing am-i.exposed at your own node, API requests never leave your local network." })}
            </p>
          </div>
        </section>

        <UmbrelSection />

        {/* Manual setup for other platforms */}
        <section id="manual" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("setup.manual_title", { defaultValue: "Manual Setup" })}
          </h2>
          <p className="text-muted leading-relaxed">
            {t("setup.manual_desc", { defaultValue: "For Start9, Docker, bare-metal, or if you prefer using the am-i.exposed website with your own node instead of the Umbrel app." })}
          </p>

          {/* Important callout */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex gap-3">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-foreground font-medium text-sm">
                {t("setup.manual_warning_title", { defaultValue: "Two things must be true for manual setup" })}
              </p>
              <ol className="text-muted text-sm leading-relaxed space-y-1 list-decimal list-inside">
                <li>{t("setup.manual_warning_1", { defaultValue: "Your mempool instance must have CORS headers enabled (mempool does not include them by default)" })}</li>
                <li>{t("setup.manual_warning_2", { defaultValue: "Your URL must end with /api (e.g., http://localhost:3006/api)" })}</li>
              </ol>
            </div>
          </div>
        </section>

        {/* CORS headers */}
        <section id="cors" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("setup.cors_title", { defaultValue: "Step 1: Add CORS Headers" })}
          </h2>
          <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
            <p className="text-muted leading-relaxed">
              {t("setup.cors_p1", { defaultValue: "This is the #1 reason connections fail. Mempool's nginx config does not include CORS headers by default. Without them, your browser silently blocks every API response - even if the network connection is working perfectly." })}
            </p>
            <p className="text-muted leading-relaxed">
              {t("setup.cors_p2", { defaultValue: "Add these lines to your mempool nginx config, inside the existing location /api/ { } block:" })}
            </p>
            <div className="relative">
              <pre className="bg-surface-inset rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">
                {CORS_SNIPPET}
              </pre>
              <CopyButton text={CORS_SNIPPET} />
            </div>
            <p className="text-muted leading-relaxed">
              {t("setup.cors_reload", { defaultValue: "After editing, reload nginx:" })}
            </p>
            <pre className="bg-surface-inset rounded-lg p-3 text-xs font-mono overflow-x-auto">
              nginx -s reload
            </pre>
            <p className="text-muted text-sm leading-relaxed">
              {t("setup.cors_platform_note", { defaultValue: "Where to find the nginx config depends on your platform - see the platform-specific sections below." })}
            </p>
          </div>
        </section>

        {/* SSH tunnel */}
        <section id="ssh-tunnel" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("setup.ssh_title", { defaultValue: "Step 2: SSH Tunnel" })}
          </h2>
          <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
            <p className="text-muted leading-relaxed">
              {t("setup.ssh_p1", { defaultValue: "This site is served over HTTPS. Browsers block HTTP requests from HTTPS pages (called mixed content) unless the target is localhost. An SSH tunnel forwards your node's mempool port to localhost on your machine, bypassing this restriction." })}
            </p>
            <div className="space-y-3">
              <p className="text-muted leading-relaxed">
                {t("setup.ssh_run", { defaultValue: "Open a terminal and run:" })}
              </p>
              <div className="relative">
                <pre className="bg-surface-inset rounded-lg p-3 text-xs font-mono overflow-x-auto">
                  ssh -L 3006:localhost:3006 user@your-node-ip
                </pre>
                <CopyButton text="ssh -L 3006:localhost:3006 user@your-node-ip" />
              </div>
              <p className="text-muted leading-relaxed">
                {t("setup.ssh_replace", { defaultValue: "Replace user@your-node-ip with your node's SSH credentials. This maps port 3006 on your desktop to port 3006 on your node." })}
              </p>
              <p className="text-muted leading-relaxed">
                {t("setup.ssh_settings", { defaultValue: "Then in the am-i.exposed settings (the gear icon), enter:" })}
              </p>
              <pre className="bg-surface-inset rounded-lg p-3 text-sm font-mono overflow-x-auto text-bitcoin">
                http://localhost:3006/api
              </pre>
              <div className="bg-surface-inset rounded-lg p-3 text-xs text-muted leading-relaxed">
                {t("setup.ssh_keep_open", { defaultValue: "Keep the terminal open while using the site. The tunnel stays active as long as the SSH session is running. You can add -N to the SSH command to skip opening a shell (e.g., ssh -N -L 3006:localhost:3006 ...)." })}
              </div>
            </div>
          </div>
        </section>

        <UmbrelManualSection />
        <Start9Section />
        <DockerSection />
        <CorsProxySection />
        <TroubleshootingSection />

        {/* Verifying */}
        <section id="verify" className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("setup.verify_title", { defaultValue: "Verifying It Works" })}
          </h2>
          <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-3">
            <ol className="space-y-2 text-muted leading-relaxed">
              <li className="flex gap-2">
                <span className="text-bitcoin shrink-0 font-bold">1.</span>
                <span>{t("setup.verify_step1", { defaultValue: "Click the gear icon in the header and enter your URL (e.g., http://localhost:3006/api)" })}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-bitcoin shrink-0 font-bold">2.</span>
                <span>{t("setup.verify_step2", { defaultValue: "Click Apply - you should see a green checkmark and \"Connected. Using custom endpoint.\"" })}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-bitcoin shrink-0 font-bold">3.</span>
                <span>{t("setup.verify_step3", { defaultValue: "Run an analysis on any transaction or address - results should load normally" })}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-bitcoin shrink-0 font-bold">4.</span>
                <span>{t("setup.verify_step4", { defaultValue: "The gear icon shows an orange dot when a custom endpoint is active" })}</span>
              </li>
            </ol>
          </div>
        </section>

    </PageShell>
  );
}
