<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     *
     * @return void
     */
    public function boot()
    {
        $this->configureRateLimiting();
        $this->loadRoutes();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     *
     * @return void
     */
    protected function configureRateLimiting()
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Load routes for the application.
     *
     * @return void
     */
    protected function loadRoutes()
    {
        try {
            // Just check if we have DB connection! This is to avoid
            // exceptions on new projects before configuring database options
            // DB::connection()->getPdo();

            // if (config('rinvex.pages.register_routes') && ! $this->app->routesAreCached() && Schema::hasTable(config('rinvex.pages.tables.pages'))) {
            //     app('rinvex.pages.page')->where('is_active', true)->get()->groupBy('domain')->each(function ($pages, $domain) {
            //         Route::domain($domain)->group(function () use ($pages) {
            //             $pages->each(function ($page) {
            //                 Route::get($page->uri)
            //                      ->name($page->route)
            //                      ->uses(PagesController::class)
            //                      ->middleware($page->middleware ?? ['web'])
            //                      ->where('locale', '[a-z]{2}');
            //             });
            //         });
            //     });
            // }
        } catch (Exception $e) {
            // Be quite! Do not do or say anything!!
        }
    }
}
