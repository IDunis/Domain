<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id');
            $table->string('code');
            $table->string('uri');
            $table->string('slug');
            $table->string('route');
            $table->string('domain')->nullable();
            $table->json('middleware')->nullable();
            $table->json('title');
            $table->json('subtitle')->nullable();
            $table->json('excerpt')->nullable();
            $table->json('content')->nullable();
            $table->json('h1')->nullable();
            $table->json('h2')->nullable();
            $table->json('h3')->nullable();
            $table->string('changefreq', 10)->default('monthly');
            $table->string('priority', 4)->default('0.5');
            $table->string('view');
            $table->string('status');
            $table->string('cache');
            // $table->mediumInteger('sorted')->unsigned()->default(0);
            $table->timestamps();

            // Indexes
            $table->unique(['project_id', 'uri']);
            $table->unique(['project_id', 'slug']);
            $table->unique(['project_id', 'route']);
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('pages');
    }
};
