<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Dashboard architecture
- Keep the shared navigation and import dialog in DashboardShell around the root Outlet so all four content routes share one layout.
- Keep demo data, aggregation and raw-value performance classification in the dashboard data module so all views use identical thresholds.
- CSV uploads are browser-only previews parsed with Papa Parse; never persist or imply completed imports in this interface-only stage.
