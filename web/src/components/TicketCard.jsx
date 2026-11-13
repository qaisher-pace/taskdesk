import './TicketCard.css'

function TicketCard () {

    const ticket = {
    title: 'Cannot log in on mobile',
    description: 'Users on iOS get a blank screen after entering their password.',
    status: 'open',
    priority: 'high',
    assignee: 'Asha',
  };

    return (
        <>
        <div className="card">
            <h2>{ticket.title}</h2>
            <p>{ticket.description}</p>
            <span className={`badge badge-${ticket.priority}`}></span>
            <p>Status: {ticket.status}</p>
            <p>Assigned to: {ticket.assignee}</p>
        </div>
        </>
    )
}

export default TicketCard;