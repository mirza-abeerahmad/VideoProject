export default function HomePage({ user, videos, search, filters, onFilter, onClearFilters, onOpenVideo, onUpload, onAuth }) {
  return (
    <main id="top">
      <section className="hero">
        <div>
          <p className="kicker">A considered place for moving images</p>
          <h1>Watch something<br /><em>worth keeping.</em></h1>
          <p className="hero-copy">Discover thoughtful videos, follow the people who make them, and build a library that feels like yours.</p>
          <div className="hero-actions">
            {user ? <button className="dark-button" onClick={onUpload}>Publish a video <span>↗</span></button> : <><button className="dark-button" onClick={() => onAuth('/register')}>Create account <span>↗</span></button><button className="text-button" onClick={() => onAuth('/login')}>I already have an account</button></>}
          </div>
        </div>
        <div className="hero-art"><span>PLAY<br />/ 2026</span><strong>01</strong></div>
      </section>

      <section className="content-grid">
        <div className="feed">
          <div className="section-heading"><div><p className="kicker">Fresh from the community</p><h2>For your next hour</h2></div><span>{videos.length} stories</span></div>
          <div className="feed-controls" aria-label="Video filters">
            <label>Length<select value={filters.duration} onChange={(event) => onFilter('duration', event.target.value)}><option value="all">Any length</option><option value="short">Under 5 minutes</option><option value="medium">5 to 20 minutes</option><option value="long">Over 20 minutes</option></select></label>
            <label>Sort by<select value={filters.sort} onChange={(event) => onFilter('sort', event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="views">Most viewed</option><option value="title">Title A-Z</option></select></label>
            {(search || filters.duration !== 'all' || filters.sort !== 'newest') && <button className="text-button" type="button" onClick={onClearFilters}>Clear filters</button>}
          </div>
          <div className="video-grid">
            {videos.map((video) => <article className="video-card" key={video._id} onClick={() => onOpenVideo(video)}><div className="thumbnail"><img src={video.thumbnail} alt="" /><span>{Math.round((video.duration || 0) / 60)} min</span></div><div className="video-info"><h3>{video.title}</h3><p>{video.owner?.fullName || 'Streamly creator'} · {video.views || 0} views</p></div></article>)}
          </div>
          {videos.length === 0 && <div className="empty">No videos yet. Publish the first story.</div>}
        </div>
      </section>
    </main>
  )
}
