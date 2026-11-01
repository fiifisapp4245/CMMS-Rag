const RATINGS = ["correct", "partly", "wrong"];

// The demo has no database, so feedback goes to the deployment's runtime logs.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const comment = body?.comment ?? null;
  if (
    typeof body?.message_id !== "string" ||
    !RATINGS.includes(body?.rating) ||
    (comment !== null && (typeof comment !== "string" || comment.length > 2000))
  ) {
    return Response.json({ detail: "Invalid feedback." }, { status: 422 });
  }
  console.log(JSON.stringify({ feedback: { message_id: body.message_id, rating: body.rating, comment } }));
  return Response.json({ ok: true });
}
