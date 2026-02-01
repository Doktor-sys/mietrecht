async function loadCases() {
    const token = localStorage.getItem('jm_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const res = await fetch('/api/cases', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            localStorage.removeItem('jm_token');
            window.location.href = '/login';
            return;
        }

        const cases = await res.json();
        const body = document.getElementById('case-table-body');
        const statNew = document.getElementById('stat-new');

        if (statNew) statNew.innerText = cases.length;
        if (body) {
            body.innerHTML = '';
            cases.reverse().forEach(c => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer';
                row.innerHTML = `
                    <td class="p-6 font-black text-slate-400 text-xs">${c.id}</td>
                    <td class="p-6">
                        <p class="font-bold text-slate-900">${c.user.name}</p>
                        <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider">${c.case.topic}</p>
                    </td>
                    <td class="p-6">
                        <p class="text-sm font-bold text-slate-700">${c.booking.type}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${c.booking.price} €</p>
                    </td>
                    <td class="p-6">
                        <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">${c.booking.time}</span>
                    </td>
                    <td class="p-6">
                        <span class="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-widest">${c.status}</span>
                    </td>
                    <td class="p-6">
                        <button onclick="alert('Fall-Details:\\\nTopic: ' + '${c.case.topic}' + '\\\nAnalyse: ' + '${c.case.analysis?.substring(0, 100).replace(/\n/g, ' ')}...')" class="w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                body.appendChild(row);
            });
        }
    } catch (err) {
        console.error('Error loading cases:', err);
    }
}

function logout() {
    localStorage.removeItem('jm_token');
    localStorage.removeItem('jm_role');
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
    loadCases();
    setInterval(loadCases, 10000);
});
