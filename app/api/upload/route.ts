import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.db_url;
  const supabaseSecretKey = process.env.db_secret_key;

  if (!supabaseUrl) {
    return NextResponse.json(
      {
        error: "Missing db_url environment variable.",
      },
      {
        status: 500,
      },
    );
  }

  if (!supabaseSecretKey) {
    return NextResponse.json(
      {
        error: "Missing db_secret_key environment variable.",
      },
      {
        status: 500,
      },
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const body = await request.json();

    const records = body.records;
    const department = String(
      body.department ?? "",
    ).trim();

    const procedureName = String(
      body.procedure_name ?? "",
    ).trim();

    /*
     * Validate incoming data
     */
    if (!department) {
      return NextResponse.json(
        {
          error:
            "Department could not be found in the Excel file.",
        },
        {
          status: 400,
        },
      );
    }

    if (!procedureName) {
      return NextResponse.json(
        {
          error:
            "Procedure Name could not be found in the Excel file.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return NextResponse.json(
        {
          error: "No HIRAC records received.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Check whether this Department + Procedure
     * combination has already been uploaded.
     */
    const {
      data: existingUpload,
      error: existingUploadError,
    } = await supabase
      .from("hirac_uploads")
      .select(
        "id, department, procedure_name, uploaded_at",
      )
      .ilike("department", department)
      .ilike(
        "procedure_name",
        procedureName,
      )
      .limit(1)
      .maybeSingle();

    if (existingUploadError) {
      console.error(
        "Duplicate check error:",
        existingUploadError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check previous uploads.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Duplicate found.
     *
     * Return uploaded_at so page.tsx can display
     * the date to the user.
     */
    if (existingUpload) {
      return NextResponse.json(
        {
          error:
            "This procedure has already been uploaded.",
          duplicate: true,
          department:
            existingUpload.department,
          procedure_name:
            existingUpload.procedure_name,
          uploaded_at:
            existingUpload.uploaded_at,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Create the parent upload record.
     */
    const {
      data: newUpload,
      error: uploadInsertError,
    } = await supabase
      .from("hirac_uploads")
      .insert({
        department,
        procedure_name: procedureName,
      })
      .select("id, uploaded_at")
      .single();

    /*
     * The unique database index is our second
     * layer of duplicate protection.
     *
     * PostgreSQL error 23505 = unique violation.
     */
    if (uploadInsertError) {
      if (
        uploadInsertError.code === "23505"
      ) {
        const {
          data: duplicateUpload,
        } = await supabase
          .from("hirac_uploads")
          .select(
            "department, procedure_name, uploaded_at",
          )
          .ilike(
            "department",
            department,
          )
          .ilike(
            "procedure_name",
            procedureName,
          )
          .limit(1)
          .maybeSingle();

        return NextResponse.json(
          {
            error:
              "This procedure has already been uploaded.",
            duplicate: true,
            department:
              duplicateUpload?.department ??
              department,
            procedure_name:
              duplicateUpload?.procedure_name ??
              procedureName,
            uploaded_at:
              duplicateUpload?.uploaded_at ??
              null,
          },
          {
            status: 409,
          },
        );
      }

      console.error(
        "hirac_uploads insert error:",
        uploadInsertError,
      );

      return NextResponse.json(
        {
          error: uploadInsertError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Add upload_id to every HIRAC record.
     *
     * We explicitly overwrite upload_id so the
     * browser cannot choose a different parent.
     */
    const recordsWithUploadId =
      records.map((record) => ({
        ...record,
        upload_id: newUpload.id,
      }));

    /*
     * Insert all HIRAC records.
     */
    const { error: recordsInsertError } =
      await supabase
        .from("hirac_records")
        .insert(recordsWithUploadId);

    if (recordsInsertError) {
      console.error(
        "HIRAC records insert error:",
        recordsInsertError,
      );

      /*
       * If the actual HIRAC insert fails,
       * remove the parent upload record.
       *
       * Otherwise the user could be blocked
       * from trying the upload again.
       *
       * Because the FK uses ON DELETE CASCADE,
       * any partially created child records
       * would also be removed.
       */
      await supabase
        .from("hirac_uploads")
        .delete()
        .eq("id", newUpload.id);

      return NextResponse.json(
        {
          error: recordsInsertError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Success
     */
    return NextResponse.json({
      success: true,

      count:
        recordsWithUploadId.length,

      upload_id:
        newUpload.id,

      department,

      procedure_name:
        procedureName,

      uploaded_at:
        newUpload.uploaded_at,
    });
  } catch (error) {
    console.error(
      "Upload API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Server error while uploading records.",
      },
      {
        status: 500,
      },
    );
  }
}
