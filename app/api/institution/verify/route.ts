export async function POST() {
  return Response.json(
    { error: "Institution learner access is available through approved institution email domains." },
    { status: 410 },
  );
}

export async function GET() {
  return Response.json({ organization: null });
}
