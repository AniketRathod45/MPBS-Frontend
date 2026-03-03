export default function SocietyVerification() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-[#E6ECF3] p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold text-[#3A5A7A]">
              Society Portal
            </div>
            <h1 className="text-2xl font-semibold text-[#1E2A3B]">
              Society Verification
            </h1>
            <p className="mt-2 text-sm text-[#5E6B7E]">
              This page is separate from BMC verification and can have its own
              workflow.
            </p>
          </div>
          <div className="rounded-xl bg-[#EEF3F8] px-4 py-2 text-sm font-medium text-[#3A5A7A]">
            Route: /society/verification
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-[#D6E0EB] p-4">
            <div className="text-sm font-semibold text-[#2B3D52]">
              Pending Tasks
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#1E4B6B]">
              0
            </div>
            <div className="mt-1 text-xs text-[#6A7A8C]">
              Add society-side checks here
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-[#D6E0EB] p-4">
            <div className="text-sm font-semibold text-[#2B3D52]">
              Last Verification
            </div>
            <div className="mt-2 text-sm text-[#5E6B7E]">
              Not configured
            </div>
            <div className="mt-1 text-xs text-[#6A7A8C]">
              Hook this to your backend later
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-[#F8FAFD] border border-[#E4ECF5] p-5">
          <div className="text-sm font-semibold text-[#2B3D52]">
            Next Step
          </div>
          <p className="mt-2 text-sm text-[#5E6B7E]">
            Tell me what fields or actions you want on the society verification
            page and I will build it.
          </p>
        </div>
      </div>
    </div>
  );
}
