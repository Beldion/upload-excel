export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 p-10 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-[1360px]">
        {/* Header */}
        <header className="mb-8 flex items-end justify-between gap-10">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">
              HIRAC Excel Upload
            </h1>

            <p className="text-sm text-zinc-500">
              Upload an Excel file to preview the records.
            </p>
          </div>

          {/* Upload Actions */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="excel-file"
              className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold transition hover:bg-zinc-50"
            >
              Upload Excel
            </label>

            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
            />

            <span className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-zinc-500">
              No file selected
            </span>

            <button
              type="button"
              className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Submit
            </button>
          </div>
        </header>

        {/* Table Card */}
        <main className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {/* Table Header */}
          <div className="flex h-[78px] items-center justify-between border-b border-zinc-200 px-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold">Uploaded Data</h2>
              <p className="text-sm text-zinc-500">0 records</p>
            </div>
          </div>

          {/* Table Wrapper */}
          <div className="h-[650px] w-full overflow-auto">
            <table className="w-max min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr>
                  <th className="min-w-[180px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Activity / Steps
                  </th>

                  <th className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    System
                  </th>

                  <th className="min-w-[200px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Hazard / Aspect
                  </th>

                  <th className="min-w-[200px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Risk / Impact
                  </th>

                  <th className="min-w-[100px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Routine
                  </th>

                  <th className="min-w-[120px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Non-Routine
                  </th>

                  <th className="min-w-[120px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Type
                  </th>

                  <th className="min-w-[200px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Current Control
                  </th>

                  <th className="min-w-[120px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Probability
                  </th>

                  <th className="min-w-[100px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Severity
                  </th>

                  <th className="min-w-[120px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Legal Laws
                  </th>

                  <th className="min-w-[100px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Total
                  </th>

                  <th className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Elimination
                  </th>

                  <th className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Substitution
                  </th>

                  <th className="min-w-[180px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Engineering Control
                  </th>

                  <th className="min-w-[160px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Administrative
                  </th>

                  <th className="min-w-[100px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    PPE
                  </th>

                  <th className="min-w-[200px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Additional Control
                  </th>

                  <th className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Final Probability
                  </th>

                  <th className="min-w-[120px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Final Severity
                  </th>

                  <th className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Final Legal Laws
                  </th>

                  <th className="min-w-[120px] border-b border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600">
                    Final Total
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={22}
                    className="h-[300px] text-center align-middle text-sm text-zinc-400"
                  >
                    Upload an Excel file to display data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
