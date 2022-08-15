<?php

namespace App\Domain\CMS\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory;
    // use SoftDeletes;

    protected $fillable = ['code', 'name', 'locales', 'domain', 'timezone'];
}
