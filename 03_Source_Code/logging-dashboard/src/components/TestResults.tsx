"use client";

import { useState } from "react";
import type { TestCase } from "@/lib/types";
import { CheckCircle2, XCircle, FlaskConical, Clock, Shield, Key, Database, Layers } from "lucide-react";

interface Props { tests: TestCase[] }

const CATEGORY_META = {
  auth:   { label: "AAA Authorization",       icon: <Shield size={13} />,    color: "#6366f1" },
  crypto: { label: "Asymmetric Signature",    icon: <Key size={13} />,       color: "#8b5cf6" },
  entity: { label: "Entity / Domain Logic",   icon: <Database size={13} />,  color: "#3b82f6" },
  http:   { label: "HTTP Layer",              icon: <Layers size={13} />,    color: "#22d3ee" },
};

type Category = keyof typeof CATEGORY_META;

export function TestResults({ tests }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const passed = tests.filter(t => t.status === "pass").length;
  const failed = tests.filter(t => t.status === "fail").length;
  const totalDuration = tests.reduce((s, t) => s + t.durationMs, 0);

  const categories = Object.keys(CATEGORY_META) as Category[];
  const suites = [...new Set(tests.map(t => t.suite))];

  const visible = activeCategory === "all"
    ? tests
    : tests.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tests", value: tests.length, color: "#818cf8", sub: "9 suites" },
          { label: "Passed",      value: passed,        color: "#10b981", sub: "100% success rate" },
          { label: "Failed",      value: failed,        color: "#ef4444", sub: failed === 0 ? "no failures" : "action needed" },
          { label: "Duration",    value: `${totalDuration}ms`, color: "#f59e0b", sub: `~${(totalDuration/1000).toFixed(2)}s total` },
        ].map(m => (
          <div
            key={m.label}
            className="card p-4 flex items-center gap-4"
            style={m.value !== 0 && m.label === "Failed" ? { borderColor: "#ef444450" } : {}}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: `${m.color}15`, color: m.color }}
            >
              {m.label === "Passed"   ? <CheckCircle2 size={18} /> :
               m.label === "Failed"   ? <XCircle size={18} /> :
               m.label === "Duration" ? <Clock size={18} /> :
               <FlaskConical size={18} />}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{m.value}</p>
              <p className="text-[11px] font-medium" style={{ color: m.color }}>{m.label}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pass rate bar */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Test Pass Rate</p>
          <p className="text-xs font-bold text-emerald-400">{Math.round((passed / tests.length) * 100)}%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-border)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round((passed / tests.length) * 100)}%`,
              background: "linear-gradient(90deg, #10b981, #06d6a0)",
            }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{passed} passed</span>
          {failed > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />{failed} failed</span>}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: activeCategory === "all" ? "rgba(99,102,241,0.15)" : "var(--bg-card)",
            border: activeCategory === "all" ? "1px solid rgba(99,102,241,0.35)" : "1px solid var(--bg-border)",
            color: activeCategory === "all" ? "#818cf8" : "var(--text-secondary)",
          }}
        >
          Semua ({tests.length})
        </button>
        {categories.map(cat => {
          const m = CATEGORY_META[cat];
          const count = tests.filter(t => t.category === cat).length;
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? `${m.color}15` : "var(--bg-card)",
                border: active ? `1px solid ${m.color}35` : "1px solid var(--bg-border)",
                color: active ? m.color : "var(--text-secondary)",
              }}
            >
              {m.icon}
              {m.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Test cases grouped by suite */}
      <div className="space-y-3">
        {suites
          .filter(suite => visible.some(t => t.suite === suite))
          .map(suite => {
            const sTests = visible.filter(t => t.suite === suite);
            const cat = sTests[0]?.category as Category;
            const cm = CATEGORY_META[cat] ?? CATEGORY_META.http;
            const allPass = sTests.every(t => t.status === "pass");
            return (
              <div key={suite} className="card overflow-hidden">
                {/* Suite header */}
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${cm.color}15`, color: cm.color }}
                  >
                    {cm.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{suite}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{cm.label}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span style={{ color: "var(--text-muted)" }}>{sTests.length} tests</span>
                    <span
                      className="px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: allPass ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: allPass ? "#10b981" : "#ef4444",
                      }}
                    >
                      {allPass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>

                {/* Test rows */}
                {sTests.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-2.5 text-xs transition-colors hover:bg-white/[0.01]"
                    style={{ borderBottom: i < sTests.length - 1 ? "1px solid var(--bg-border-subtle)" : "none" }}
                  >
                    {t.status === "pass"
                      ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      : <XCircle     size={13} className="text-red-400 shrink-0" />
                    }
                    <span className="flex-1" style={{ color: "var(--text-secondary)" }}>
                      {t.name}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.durationMs}ms
                    </span>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: t.status === "pass" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: t.status === "pass" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {t.status === "pass" ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
      </div>

      {/* Raw log excerpt */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)" }}
        >
          <FlaskConical size={13} className="text-indigo-400" />
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Jest Output — Raw Log</p>
        </div>
        <pre
          className="p-5 text-[11px] leading-relaxed overflow-x-auto font-mono"
          style={{ background: "#050810", color: "#4a6a8a", maxHeight: 280 }}
        >
{`PASS src/feature/auth/digital-signature/asymmetric-signature.service.spec.ts
  Unit Test: AsymmetricSignatureService
    ✓ must instantiate and expose a PEM public key (65 ms)
    ✓ must sign data and verify the signature (valid case) (63 ms)
    ✓ must reject a tampered payload (non-repudiation check) (85 ms)
    ✓ must reject a forged signature (invalid base64 bytes) (56 ms)
    ✓ must reject an empty signature string (50 ms)
    ✓ must produce different signatures for different data (28 ms)
    ✓ must produce a stable signature verifiable across service instances (22 ms)

PASS src/feature/auth/guards/auth.guard.spec.ts
  Unit Test: AuthGuard — AAA Authorization Layer
    ✓ must throw 401 when Authorization header is absent (5 ms)
    ✓ must throw 401 when Authorization header has no token part (1 ms)
    ✓ must throw 401 when JWT is invalid or expired (1 ms)
    ✓ must throw 401 when token hash does not match DB record (revoked token) (0 ms)
    ✓ must throw 403 when student accesses teacher route (1 ms)
    ✓ must throw 403 when parent accesses admin route (0 ms)
    ✓ must allow access when role matches required role (1 ms)
    ✓ must allow access when ANY role is accepted (0 ms)
    ✓ must allow access when no roles are required (0 ms)

Test Suites: 9 passed, 9 total
Tests:       59 passed, 59 total
Snapshots:   0 total
Time:        3.439 s`}
        </pre>
      </div>
    </div>
  );
}
