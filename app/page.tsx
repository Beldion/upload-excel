"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type HiracRecord = {
  source_file: string;
  sheet_name: string;
  excel_row_number: number;

  activity_steps: string | null;
  system: string | null;
  hazard_aspect: string | null;
  risk_impact: string | null;

  routine: boolean;
  non_routine: boolean;

  type: string | null;
  current_control: string | null;

  initial_probability: number | null;
  initial_severity: number | null;
  initial_legal_laws: number | null;
  initial_total: number | null;

  elimination: string | null;
  substitution: string | null;
  engineering_control: string | null;
  administrative_control: string | null;
  ppe: string | null;

  additional_control: string | null;

  final_probability: number | null;
  final_severity: number | null;
  final_legal_laws: number | null;
  final_total: number | null;
};

function cleanText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text === "" ? null : text;
}

function cleanNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function isChecked(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value).trim().toLowerCase();

  return (
    text === "x" ||
    text === "yes" ||
    text === "true" ||
    text === "1" ||
    text === "✓"
  );
}

function parseWorkbook(file: File, workbook: XLSX.WorkBook) {
  const records: HiracRecord[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    // Find the row containing "ACTIVITY / STEPS"
    const headerRowIndex = rows.findIndex((row) =>
      row.some(
        (cell) =>
          String(cell ?? "")
            .trim()
            .toUpperCase() === "ACTIVITY / STEPS",
      ),
    );

    // Ignore sheets that don't contain the HIRAC table.
    if (headerRowIndex === -1) {
      return;
    }

    const headerRow = rows[headerRowIndex];

    // Find which Excel column the table starts at.
    const startColumn = headerRow.findIndex(
      (cell) =>
        String(cell ?? "")
          .trim()
          .toUpperCase() === "ACTIVITY / STEPS",
    );

    if (startColumn === -1) {
      return;
    }

    // Based on the HIRAC Excel structure,
    // actual data starts after the multi-row headers.
    const dataStartRow = headerRowIndex + 4;

    for (
      let rowIndex = dataStartRow;
      rowIndex < rows.length;
      rowIndex++
    ) {
      const row = rows[rowIndex];

      const rowText = row
        .map((cell) => String(cell ?? "").toUpperCase())
        .join(" ");

      // Stop once we reach the document footer/signatures.
      if (
        rowText.includes("REFERENCE PROCEDURE") ||
        rowText.includes("PREPARED BY:") ||
        rowText.includes("REVIEWED BY:") ||
        rowText.includes("APPROVED BY:")
      ) {
        break;
      }

      // Only examine the 22 HIRAC columns.
      const values = row.slice(
        startColumn,
        startColumn + 22,
      );

      // Skip completely empty rows.
      const hasData = values.some((value) => {
        return (
          value !== "" &&
          value !== null &&
          value !== undefined
        );
      });

      if (!hasData) {
        continue;
      }

      const record: HiracRecord = {
        source_file: file.name,
        sheet_name: sheetName,
        excel_row_number: rowIndex + 1,

        activity_steps: cleanText(row[startColumn]),
        system: cleanText(row[startColumn + 1]),
        hazard_aspect: cleanText(row[startColumn + 2]),
        risk_impact: cleanText(row[startColumn + 3]),

        routine: isChecked(row[startColumn + 4]),
        non_routine: isChecked(row[startColumn + 5]),

        type: cleanText(row[startColumn + 6]),
        current_control: cleanText(row[startColumn + 7]),

        initial_probability: cleanNumber(
          row[startColumn + 8],
        ),

        initial_severity: cleanNumber(
          row[startColumn + 9],
        ),

        initial_legal_laws: cleanNumber(
          row[startColumn + 10],
        ),

        initial_total: cleanNumber(
          row[startColumn + 11],
        ),

        elimination: cleanText(
          row[startColumn + 12],
        ),

        substitution: cleanText(
          row[startColumn + 13],
        ),

        engineering_control: cleanText(
          row[startColumn + 14],
        ),

        administrative_control: cleanText(
          row[startColumn + 15],
        ),

        ppe: cleanText(
          row[startColumn + 16],
        ),

        additional_control: cleanText(
          row[startColumn + 17],
        ),

        final_probability: cleanNumber(
          row[startColumn + 18],
        ),

        final_severity: cleanNumber(
          row[startColumn + 19],
        ),

        final_legal_laws: cleanNumber(
          row[startColumn + 20],
        ),

        final_total: cleanNumber(
          row[startColumn + 21],
        ),
      };

      records.push(record);
    }
  });

  return records;
}

export default function Home() {
  const [fileName, setFileName] =
    useState("No file selected");

  const [records, setRecords] = useState<
    HiracRecord[]
  >([]);

  const [message, setMessage] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setMessage("Reading Excel file...");

    try {
      const arrayBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
      });

      const parsedRecords = parseWorkbook(
        file,
        workbook,
      );

      setRecords(parsedRecords);

      setMessage(
        `${parsedRecords.length} records found in Excel.`,
      );
    } catch (error) {
      console.error(error);

      setRecords([]);

      setMessage(
        "Unable to read the Excel file.",
      );
    }
  }

  function handleSubmit() {
    if (records.length === 0) {
      setMessage(
        "Please upload an Excel file first.",
      );

      return;
    }

    // We will connect this to Supabase next.
    console.log("Records ready:", records);

    setMessage(
      `${records.length} records are ready to submit.`,
    );
  }

  const headers = [
    "Activity / Steps",
    "System",
    "Hazard / Aspect",
    "Risk / Impact",
    "Routine",
    "Non-Routine",
    "Type",
    "Current Control",
    "Probability",
    "Severity",
    "Legal Laws",
    "Total",
    "Elimination",
    "Substitution",
    "Engineering Control",
    "Administrative",
    "PPE",
    "Additional Control",
    "Final Probability",
    "Final Severity",
    "Final Legal Laws",
    "Final Total",
  ];

  return (
    <div className="min-h-screen bg-zinc-100 p-10 font-sans text-zinc-900">
      <div className="mx-auto w-full max-w-[1360px]">
        {/* HEADER */}

        <header className="mb-8 flex items-end justify-between gap-10">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">
              HIRAC Excel Upload
            </h1>

            <p className="text-sm text-zinc-500">
              Upload an Excel file to preview the
              records.
            </p>
          </div>

          {/* UPLOAD ACTIONS */}

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
              onChange={handleFileChange}
            />

            <span className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-zinc-500">
              {fileName}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={records.length === 0}
              className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        </header>

        {/* STATUS MESSAGE */}

        {message && (
          <div className="mb-4 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {message}
          </div>
        )}

        {/* TABLE */}

        <main className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex h-[78px] items-center justify-between border-b border-zinc-200 px-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold">
                Uploaded Data
              </h2>

              <p className="text-sm text-zinc-500">
                {records.length} records
              </p>
            </div>
          </div>

          <div className="h-[650px] w-full overflow-auto">
            <table className="w-max min-w-full border-collapse text-sm">
              {/* TABLE HEADER */}

              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="min-w-[140px] border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold whitespace-nowrap text-zinc-600"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={22}
                      className="h-[300px] text-center align-middle text-sm text-zinc-400"
                    >
                      Upload an Excel file to display
                      data.
                    </td>
                  </tr>
                ) : (
                  records.map(
                    (record, index) => (
                      <tr
                        key={`${record.sheet_name}-${record.excel_row_number}-${index}`}
                        className="hover:bg-zinc-50"
                      >
                        <td className="max-w-[250px] border-b border-r border-zinc-200 p-4 align-top">
                          {record.activity_steps}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.system}
                        </td>

                        <td className="max-w-[250px] border-b border-r border-zinc-200 p-4 align-top">
                          {record.hazard_aspect}
                        </td>

                        <td className="max-w-[250px] border-b border-r border-zinc-200 p-4 align-top">
                          {record.risk_impact}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.routine
                            ? "Yes"
                            : ""}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.non_routine
                            ? "Yes"
                            : ""}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.type}
                        </td>

                        <td className="max-w-[300px] border-b border-r border-zinc-200 p-4 align-top">
                          {record.current_control}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_probability
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.initial_severity}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_legal_laws
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.initial_total}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.elimination}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.substitution}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.engineering_control
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.administrative_control
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.ppe}
                        </td>

                        <td className="max-w-[300px] border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.additional_control
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.final_probability
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.final_severity}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.final_legal_laws
                          }
                        </td>

                        <td className="border-b border-zinc-200 p-4 align-top">
                          {record.final_total}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
