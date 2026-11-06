package com.shankarapps.actechpro;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.JavascriptInterface;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new BarsBridge(), "ACTBars");
    }

    private class BarsBridge {
        @JavascriptInterface
        public void set(final String statusColor, final String navColor, final boolean lightIcons) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Window w = getWindow();
                        w.setStatusBarColor(Color.parseColor(statusColor));
                        w.setNavigationBarColor(Color.parseColor(navColor));
                        WindowInsetsControllerCompat c =
                            WindowCompat.getInsetsController(w, w.getDecorView());
                        c.setAppearanceLightStatusBars(lightIcons);
                        c.setAppearanceLightNavigationBars(lightIcons);
                    } catch (Exception ignored) {}
                }
            });
        }
    }
}
