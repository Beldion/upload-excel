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
  if (
    value === undefined ||
    value === null
  ) {
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

function isActualDataRow(
  row: unknown[],
  startColumn: number,
) {
  /*
   * IMPORTANT:
   *
   * Do not use TOTAL columns to determine whether this
   * is a real record.
   *
   * Blank Excel template rows sometimes contain
   * formulas that evaluate to 0.
   *
   * Instead, check the descriptive HIRAC fields.
   */

  const meaningfulColumns = [
    startColumn, // Activity
    startColumn + 1, // System
    startColumn + 2, // Hazard
    startColumn + 3, // Risk
    startColumn + 6, // Type
    startColumn + 7, // Current Control
    startColumn + 12, // Elimination
    startColumn + 13, // Substitution
    startColumn + 14, // Engineering
    startColumn + 15, // Administrative
    startColumn + 16, // PPE
    startColumn + 17, // Additional Control
  ];

  return meaningfulColumns.some(
    (columnIndex) =>
      cleanText(row[columnIndex]) !== null,
  );
}

function parseWorkbook(
  file: File,
  workbook: XLSX.WorkBook,
) {
  const records: HiracRecord[] = [];

  /*
   * For now we continue processing only the
   * first worksheet.
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
   * Supports both:
   *
   * ACTIVITY / STEP
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

  const startColumn =
    headerRow.findIndex((cell) =>
      isActivityHeader(cell),
    );

  if (startColumn === -1) {
    return records;
  }

  /*
   * Instead of assuming data always starts
   * +3 or +4 rows after the main header,
   * find the first genuine data row.
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
   * Used for Excel vertically merged Activity cells.
   *
   * Example:
   *
   * Activity A | QMS | hazard...
   *            | EMS | hazard...
   *            | OHS | hazard...
   *
   * All three records will receive Activity A.
   */
  let currentActivity:
    | string
    | null = null;

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
     * Ignore empty template rows even when
     * Excel formulas put zeros in TOTAL cells.
     */
    if (
      !isActualDataRow(
        row,
        startColumn,
      )
    ) {
      continue;
    }

    const activityFromRow =
      cleanText(
        row[startColumn],
      );

    if (activityFromRow) {
      currentActivity =
        activityFromRow;
    }

    const record: HiracRecord =
      {
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

        non_routine:
          isChecked(
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
    if (
      records.length === 0
    ) {
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
        <header className="mb-8 flex items-end justify-between gap-10">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">
              HIRAC Excel Upload
            </h1>

            <p className="text-sm text-zinc-500">
              Upload an Excel file
              to preview the
              records.
            </p>
          </div>

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
                records.length ===
                  0 ||
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

        {message && (
          <div className="mb-4 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {message}
          </div>
        )}

        <main className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex h-[78px] items-center justify-between border-b border-zinc-200 px-6">
            <div>
              <h2 className="mb-1 text-lg font-semibold">
                Uploaded Data
              </h2>

              <p className="text-sm text-zinc-500">
                {
                  records.length
                }{" "}
                records
              </p>
            </div>
          </div>

          <div className="h-[650px] w-full overflow-auto">
            <table className="w-max min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr>
                  {headers.map(
                    (header) => (
                      <th
                        key={
                          header
                        }
                        className="min-w-[140px] whitespace-nowrap border-b border-r border-zinc-200 px-4 py-4 text-left text-xs font-semibold text-zinc-600"
                      >
                        {
                          header
                        }
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {records.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        22
                      }
                      className="h-[300px] text-center align-middle text-sm text-zinc-400"
                    >
                      Upload an Excel
                      file to display
                      data.
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
                          {
                            record.activity_steps
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.system
                          }
                        </td>

                        <td className="max-w-[250px] border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.hazard_aspect
                          }
                        </td>

                        <td className="max-w-[250px] border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.risk_impact
                          }
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
                          {
                            record.type
                          }
                        </td>

                        <td className="max-w-[300px] border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.current_control
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_probability
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_severity
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_legal_laws
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.initial_total
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.elimination
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.substitution
                          }
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
                          {
                            record.ppe
                          }
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
                          {
                            record.final_severity
                          }
                        </td>

                        <td className="border-b border-r border-zinc-200 p-4 align-top">
                          {
                            record.final_legal_laws
                          }
                        </td>

                        <td className="border-b border-zinc-200 p-4 align-top">
                          {
                            record.final_total
                          }
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
