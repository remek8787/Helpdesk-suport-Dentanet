export function initSocket(io: any, db: any) {
  io.on('connection', (socket: any) => {
    console.log('[WS] client connected:', socket.id);

    socket.on('staff:presence', (payload: { staffId: number; status: string }) => {
      if (!payload?.staffId) return;
      const status = ['online', 'busy', 'offline'].includes(payload.status) ? payload.status : 'online';
      db.prepare(`UPDATE staff SET status = ? WHERE id = ?`).run(status, payload.staffId);
      io.emit('staff:presence:update', payload);
    });

    socket.on('disconnect', () => {
      console.log('[WS] client disconnected:', socket.id);
    });
  });
}
