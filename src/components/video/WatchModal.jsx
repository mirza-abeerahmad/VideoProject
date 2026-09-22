export default function WatchModal({ video, comments, comment, onCommentChange, onCommentSubmit, onLike, onSubscribe, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="watch-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <video className="watch-video" controls playsInline poster={video.thumbnail} src={video.videoFile}>Your browser does not support video playback.</video>
        <p className="kicker">Now watching</p>
        <h2>{video.title}</h2>
        <p className="muted">{video.description}</p>
        <div className="watch-actions"><button className="dark-button" onClick={onLike}>♡ Like</button><button className="outline-button" onClick={onSubscribe}>Follow creator</button></div>
        <form className="comment-form" onSubmit={onCommentSubmit}><input value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Leave a thought" /><button>Post</button></form>
        <div className="comments">{comments.map((item) => <div className="comment" key={item._id}><strong>{item.owner?.fullName || 'Viewer'}</strong><span>{item.content}</span></div>)}</div>
      </section>
    </div>
  )
}
