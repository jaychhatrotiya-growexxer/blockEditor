export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
        <div className="auth-footer">{footer}</div>
      </section>
    </main>
  );
}
