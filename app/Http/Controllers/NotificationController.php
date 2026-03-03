<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Tandai satu notifikasi sudah dibaca
    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
            
            // Redirect ke URL yang ada di dalam data notifikasi (jika ada)
            if (isset($notification->data['url'])) {
                return redirect($notification->data['url']);
            }
        }
        return back();
    }

    // Tandai semua sudah dibaca
    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return back()->with('success', 'Semua notifikasi telah dibaca.');
    }
}