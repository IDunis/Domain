<?php

namespace App\Console\Commands;

use App\Domain\CMS\Models\Project;
use Illuminate\Console\Command;

class InitialProject extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'project:initial';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initial project';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $project = Project::updateOrCreate(
            ['code' => 'DEV'],
            [
                'locales' => ['en', 'vi'],
                'domain' => 'dev.localhost'
            ]
        );

        return $project ? 1 : 0;
    }
}
