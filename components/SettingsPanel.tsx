import React from 'react';

const SettingsPanel = () => {
  const FEEDBACK_EMAIL = 'everydaylife9960@gmail.com';
  const SUBJECT = encodeURIComponent('Great One Grind — Beta Feedback');
  const BODY = encodeURIComponent(
    `Device (PC / Android / iPhone):
Browser (Chrome / Safari / Edge):
What happened?
What did you expect?

Steps to reproduce:
1)
2)
3)

(Optional) Screenshot link:`
  );

  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${SUBJECT}&body=${BODY}`;

  return (
    <div className="p-4 space-y-3">
      <div>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm">
          This app is in <span className="text-amber-400 font-semibold">v1.0 Beta</span>. Data may reset between versions.
        </p>
      </div>

      <a
        href={mailto}
        className="inline-flex items-center justify-center w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl hover:border-emerald-500 hover:text-emerald-300 transition"
      >
        ✉️ Send Feedback
      </a>

      <p className="text-[11px] text-slate-500">
        Tapping “Send Feedback” opens your email app with a pre-filled template.
      </p>
    </div>
  );
};

export default SettingsPanel;
