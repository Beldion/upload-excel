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
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function isChecked(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value)
    .trim()
    .toLowerCase();

  return (
    text === "x" ||
    text === "yes" ||
    text === "true" ||
    text === "1" ||
    text === "✓"
  );
}

/*
 * Supports both versions we've encountered:
 *
 * ACTIVITY / STEP
 * ACTIVITY / STEPS
 */
function isActivityHeader(value: unknown) {
  const text = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  return (
    text === "ACTIVITY / STEP" ||
    text === "ACTIVITY / STEPS"
  );
}

/*
 * Detect the footer/signature section so it does
 * not get interpreted as HIRAC data.
 */
function isFooterRow(row: unknown[]) {
  const rowText = row
    .map((cell) =>
      String(cell ?? "").toUpperCase(),
    )
    .join(" ");

  return (
    rowText.includes("REFERENCE PROCEDURE") ||
    rowText.includes("PREPARED BY:") ||
    rowText.includes("REVIEWED BY:") ||
    rowText.includes("APPROVED BY:") ||
    rowText.includes("NOTED BY:")
  );
}

/*
 * Determine whether an Excel row represents
 * an actual HIRAC record.
 *
 * We only use the primary data columns here.
 *
 * We intentionally DO NOT use:
 * - evaluation fields
 * - hierarchy headers
 * - totals
 *
 * because Excel header/template rows can contain
 * text or formulas in those columns.
 */
function isActualDataRow(
  row: unknown[],
  startColumn: number,
) {
  const activity = cleanText(
    row[startColumn],
  );

  const system = cleanText(
    row[startColumn + 1],
  );

  const hazard = cleanText(
    row[startColumn + 2],
  );

  const risk = cleanText(
    row[startColumn + 3],
  );

  const currentControl = cleanText(
    row[startColumn + 7],
  );

  return Boolean(
    activity ||
      system ||
      hazard ||
      risk ||
      currentControl,
  );
}

function parseWorkbook(
  file: File,
  workbook: XLSX.WorkBook,
) {
  const records: HiracRecord[] = [];

  /*
   * For now, process only the FIRST worksheet.
   */
  const sheetName =
    workbook.SheetNames[0];

  if (!sheetName) {
    return records;
  }

  const worksheet =
    workbook.Sheets[sheetName];

  const rows =
    XLSX.utils.sheet_to_json<unknown[]>(
      worksheet,
      {
        header: 1,
        defval: "",
        raw: true,
      },
    );

  /*
   * Find:
   *
   * ACTIVITY / STEP
   *
   * or:
   *
   * ACTIVITY / STEPS
   */
  const headerRowIndex =
    rows.findIndex((row) =>
      row.some((cell) =>
        isActivityHeader(cell),
      ),
    );

  if (headerRowIndex === -1) {
    return records;
  }

  const headerRow =
    rows[headerRowIndex];

  /*
   * Find where the HIRAC table begins horizontally.
   */
  const startColumn =
    headerRow.findIndex((cell) =>
      isActivityHeader(cell),
    );

  if (startColumn === -1) {
    return records;
  }

  /*
   * Find the first REAL data row.
   *
   * This means we no longer assume:
   *
   * header + 3
   *
   * or:
   *
   * header + 4
   *
   * Different HIRAC templates can therefore
   * contain different numbers of header rows.
   */
  let dataStartRow = -1;

  for (
    let rowIndex =
      headerRowIndex + 1;
    rowIndex < rows.length;
    rowIndex++
  ) {
    const row = rows[rowIndex];

    if (isFooterRow(row)) {
      break;
    }

    if (
      isActualDataRow(
        row,
        startColumn,
      )
    ) {
      dataStartRow = rowIndex;
      break;
    }
  }

  if (dataStartRow === -1) {
    return records;
  }

  /*
   * Excel merged cells only store their value
   * in the first physical row.
   *
   * Example:
   *
   * Activity A | QMS | Hazard 1
   *            | EMS | Hazard 2
   *            | OHS | Hazard 3
   *
   * currentActivity lets us convert that into:
   *
   * Activity A | QMS | Hazard 1
   * Activity A | EMS | Hazard 2
   * Activity A | OHS | Hazard 3
   */
  let currentActivity: string | null =
    null;

  for (
    let rowIndex = dataStartRow;
    rowIndex < rows.length;
    rowIndex++
  ) {
    const row = rows[rowIndex];

    if (isFooterRow(row)) {
      break;
    }

    /*
     * Ignore blank template rows.
     */
    if (
      !isActualDataRow(
        row,
        startColumn,
      )
    ) {
      continue;
    }

    /*
     * Update the current Activity whenever
     * Excel gives us a new Activity value.
     */
    const activityFromRow =
      cleanText(
        row[startColumn],
      );

    if (activityFromRow) {
      currentActivity =
        activityFromRow;
    }

    const record: HiracRecord = {
      source_file: file.name,
      sheet_name: sheetName,
      excel_row_number:
        rowIndex + 1,

      activity_steps:
        currentActivity,

      system: cleanText(
        row[startColumn + 1],
      ),

      hazard_aspect:
        cleanText(
          row[startColumn + 2],
        ),

      risk_impact:
        cleanText(
          row[startColumn + 3],
        ),

      routine: isChecked(
        row[startColumn + 4],
      ),

      non_routine: isChecked(
        row[startColumn + 5],
      ),

      type: cleanText(
        row[startColumn + 6],
      ),

      current_control:
        cleanText(
          row[startColumn + 7],
        ),

      initial_probability:
        cleanNumber(
          row[startColumn + 8],
        ),

      initial_severity:
        cleanNumber(
          row[startColumn + 9],
        ),

      initial_legal_laws:
        cleanNumber(
          row[startColumn + 10],
        ),

      initial_total:
        cleanNumber(
          row[startColumn + 11],
        ),

      elimination:
        cleanText(
          row[startColumn + 12],
        ),

      substitution:
        cleanText(
          row[startColumn + 13],
        ),

      engineering_control:
        cleanText(
          row[startColumn + 14],
        ),

      administrative_control:
        cleanText(
          row[startColumn + 15],
        ),

      ppe: cleanText(
        row[startColumn + 16],
      ),

      additional_control:
        cleanText(
          row[startColumn + 17],
        ),

      final_probability:
        cleanNumber(
          row[startColumn + 18],
        ),

      final_severity:
        cleanNumber(
          row[startColumn + 19],
        ),

      final_legal_laws:
        cleanNumber(
          row[startColumn + 20],
        ),

      final_total:
        cleanNumber(
          row[startColumn + 21],
        ),
    };

    records.push(record);
  }

  return records;
}

export default function Home() {
  const [fileName, setFileName] =
    useState("No file selected");

  const [records, setRecords] =
    useState<HiracRecord[]>([]);

  const [message, setMessage] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setRecords([]);

    setMessage(
      "Reading Excel file...",
    );

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(arrayBuffer, {
          type: "array",
        });

      const parsedRecords =
        parseWorkbook(
          file,
          workbook,
        );

      setRecords(
        parsedRecords,
      );

      setMessage(
        `${parsedRecords.length} records found in the first worksheet.`,
      );
    } catch (error) {
      console.error(error);

      setRecords([]);

      setMessage(
        "Unable to read the Excel file.",
      );
    }
  }

  async function handleSubmit() {
    if (records.length === 0) {
      setMessage(
        "Please upload an Excel file first.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      setMessage(
        "Uploading records to Supabase...",
      );

      const response =
        await fetch(
          "/api/upload",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              records,
            }),
          },
        );

      /*
       * Read as text first so an HTML error page
       * doesn't cause:
       *
       * Unexpected token '<'
       */
      const responseText =
        await response.text();

      let result;

      try {
        result =
          JSON.parse(
            responseText,
          );
      } catch {
        throw new Error(
          `API returned an invalid response. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Upload failed with status ${response.status}`,
        );
      }

      setMessage(
        `${result.count} records successfully uploaded to Supabase.`,
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              Upload an Excel file to preview the records.
            </p>
          </div>

          {/* UPLOAD CONTROLS */}

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
              onChange={
                handleFileChange
              }
            />

            <span className="w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-sm text-zinc-500">
              {fileName}
            </span>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                records.length === 0 ||
                isSubmitting
              }
              className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit"}
            </button>
          </div>
        </header>

        {/* MESSAGE */}

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
                  {headers.map(
                    (header) => (
                      <th
                        key={header}
                        className="min-w-[140px] whitespace-nowrap border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600"
                      >
                        {header}
                      </th>
                    ),
                  )}
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
                      Upload an Excel file to display data.
                    </td>
                  </tr>
                ) : (
                  records.map(
                    (
                      record,
                      index,
                    ) => (
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
                          {record.initial_probability}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.initial_severity}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.initial_legal_laws}
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
                          {record.engineering_control}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.administrative_control}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.ppe}
                        </td>

                        <td className="max-w-[300px] border-b border-r border-zinc-200 p-4 align-top">
                          {record.additional_control}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.final_probability}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.final_severity}
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {record.final_legal_laws}
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
