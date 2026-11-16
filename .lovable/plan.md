# Student Dashboard-Only Visual Rebuild

## Scope
- Change only the Student Dashboard/Home screen at `/student`.
- Preserve all routes, authentication, Supabase queries, data models, business logic, and every other student/admin/staff/parent page.
- Treat the uploaded blue dashboard as a visual reference, not an asset to embed.

## Implementation
1. Revert the global forest/gold palette, global font changes, and shared `StudentLayout` redesign introduced in the previous pass so the rest of the site remains unchanged.
2. Keep the generated school-backpack photograph as the Student Dashboard hero image only.
3. Rebuild the dashboard with the reference’s blue/white visual language: editorial greeting hero, blue lesson focal panel, compact attendance/fees/homework strip, human status summary, clean result rows, school-life timeline, and compact quick access.
4. Use dashboard-scoped CSS/classes and custom SVG icons so no styling leaks into other pages.
5. Use live backend data when available and clearly isolated presentation fallbacks only when records are empty.

## Verification
- Check the dashboard at 360px, 390px, 430px, 768px, and desktop width.
- Confirm navigation links, retry state, live data rendering, and bottom navigation still work.
- Check build/runtime logs and verify no other route’s shared design changed.
