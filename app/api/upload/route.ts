import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const records = body.records;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        {
          error: "No records received.",
        },
        {
          status: 400,
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

    const { error } = await supabase
      .from("hirac_records")
      .insert(records);

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      count: records.length,
    });
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      {
        error: "Server error while uploading records.",
      },
      {
        status: 500,
      },
    );
  }
}
