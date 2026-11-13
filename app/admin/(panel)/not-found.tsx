import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="empty">
      <p>That page or record does not exist.</p>
      <Link href="/admin" className="abtn abtn--primary">
        Back to the dashboard
      </Link>
    </div>
  );
}
