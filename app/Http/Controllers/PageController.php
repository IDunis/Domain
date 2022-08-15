<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class PagesController extends BaseController
{
    public function __invoke(Request $request)
    {
      // $page = Page::where('uri', $request->route()->uri())->where('domain', $request->route()->domain() ?: null)->first();

      // return view($page->view, compact('page'));
    }
}