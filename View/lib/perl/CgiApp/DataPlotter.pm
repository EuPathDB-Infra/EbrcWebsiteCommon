
package EbrcWebsiteCommon::View::CgiApp::DataPlotter;



=pod

=head1 Purpose

Plot (expression) data in GUS using R.

=head1 Remember!

This is intended as a CGI script.  When testing via the command line
set parameters using this format, 'type=mytype', rather than '--type
mytype'.

=head1 Details

Program takes these parameters:

=over 4

=item type  : string : type of plot to draw; tail of package name

=item id    : string : plots data for object with this ID

=item sid   : string : secondary id for plotting

=item fmt   : string : graphics format to output; [pdf,jpeg,png,gif,svg] defaults to png

=item quiet : int : when non-zero the MIME header and file contents are not output

=item save  : int : when non-zero the temporary files are saved

=back

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::CgiApp );

use EbrcWebsiteCommon::View::CgiApp;

use JSON;
use Data::Dumper;
use Time::HiRes qw(time);
# ========================================================================
# --------------------------- Required Methods ---------------------------
# ========================================================================

# --------------------------------- run ----------------------------------

sub run {
	 my $Self = shift;
	 my $Cgi  = shift;
         my $baseUrl = $Cgi->param('baseUrl') ? $Cgi->param('baseUrl') : $Cgi->url( -base => 1 );

	 my $pkg          = $Cgi->param('project_id');
	 my $type           = $Cgi->param('type');
	 $pkg = "EuPathDB" if ($type eq 'PathwayGenera' || $type =~ /UserDatasets/);
	 my $id             = $Cgi->param('id');
	 my $sid            = $Cgi->param('sid');
	 my $wantLogged     = $Cgi->param('wl');
	 my $format         = $Cgi->param('fmt')    || 'png';
	 my $quiet_b        = $Cgi->param('quiet');
	 my $save_b         = $Cgi->param('save');
	 my $typeArg        = $Cgi->param('typeArg');
         my $template     = $Cgi->param('template');

         my $datasetId     = $Cgi->param('datasetId');

         my $widthOverride     = $Cgi->param('w');
         my $heightOverride     = $Cgi->param('h');
         my $compact     = $Cgi->param('compact');
         my $idType     = $Cgi->param('idType');

         my $declareParts     = $Cgi->param('declareParts');

         my $xminOverride     = $Cgi->param('xmin');
         my $xmaxOverride     = $Cgi->param('xmax');

         my $contXAxis = $Cgi->param('contXAxis');
         my $yAxis     = $Cgi->param('yAxis');
         my @yAxis     = split(',', $yAxis || '');

         my $status      = $Cgi->param('status');
         my $optStatus   = $Cgi->param('optStatus');

         my $sampleInfo = $Cgi->param('sampleInfo');
         my @sampleInfo = split(',', $sampleInfo || '');

         my $eventStart = $Cgi->param('eventStart');
         my $eventDur = $Cgi->param('eventDur');

         my $facet = $Cgi->param('facet');
         my @facets   = split(',', $facet || '');

         my $default    = $Cgi->param('default');

         my $thumbnail_b    = $Cgi->param('thumb');
         my @visibleParts   = split(',', $Cgi->param('vp') || '');

         my $visiblePartsAreFuzzy     = $Cgi->param('vpAreFuzzy');

	 my @errors;

	 push(@errors, 'model must be supplied') if not defined $pkg;


         my %allowedProjects = ('UniDB' => 1,
                                'PlasmoDB' => 1,
                                'ToxoDB' => 1,
                                'GiardiaDB' => 1,
                                'AmoebaDB' => 1,
                                'TrichDB' => 1,
                                'TriTrypDB' => 1,
                                'FungiDB' => 1,
                                'CryptoDB' => 1,
                                'PiroplasmaDB' => 1,
                                'MicrosporidiaDB' => 1,
                                'HostDB' => 1,
                                'VectorBase' => 1,
                                'EuPathDB' => 1,
                                'ClinEpiDB' => 1,
                                'MicrobiomeDB' => 1,
                                'Gates' => 1,
                                'ICEMR' => 1,
                                'UserDatasets' => 1,
                                'AllClinEpiDB' => 1,
             );

	 push(@errors, $pkg . ' is an unallowed value for Project_id arg') unless($allowedProjects{$pkg});
	   push(@errors, 'type must be supplied' ) if not defined $type;
	   push(@errors, 'id must be supplied'   ) if not defined $id;

	 if (@errors) {
			die join("\n", @errors);
	 }
	
	 # will declare this content type
	 my %contentType = ( png   => 'image/png',
                             pdf   => 'application/pdf',
                             jpeg  => 'image/jpeg',
                             jpg   => 'image/jpeg',
                             gif   => 'image/gif',
                             table => 'text/html',
			     html  => 'text/html',
			     svg   => 'text/xml'
										 );

   # some GDD formats may be different from their formats
   my %gddFormat = ( 'jpg' => 'jpeg' );
   my $gddFormat = $gddFormat{$format} || $format;

	 # some extensions may be different from their format
	 my %extension = ( 'jpeg' => 'jpg', 
                           'table' => 'txt', 
             );
	 my $ext = $extension{$format} || $format;

	 # write to these files.


	 my $fmt_f = "/tmp/dataPlotter-$$.$ext";

         my $project = $pkg;
         my $core;
         if ($pkg eq 'ClinEpiDB' || $pkg eq 'Gates' || $pkg eq 'ICEMR' || $pkg eq 'AllClinEpiDB' ) {
           $core = 'ClinEpiWebsite::View::GraphPackage::';
         } elsif ( $pkg eq 'MicrobiomeDB') {
           $core = 'MicrobiomeWebsite::View::GraphPackage::';
         } else {
           $core = 'ApiCommonWebsite::View::GraphPackage::';
           $pkg = 'EuPathDB';
         }

         $pkg = "Templates" if($template);

         my $class = "$core" . "$pkg" . "::$type";

         # dataset Need to strip the dashes from package name
         my $datasetClassName = $datasetId;
         $datasetClassName =~ s/-//g if ($datasetClassName);

         eval "require $class";
         eval "import $class";

         #if ($core =~ 'ApiCommon') {
	   $class = $class . "::$datasetClassName" if($template);
         #}

         my $_gp = eval {
           $class->new({dataPlotterArg => $typeArg,
                        Id => $id,
                        SecondaryId => $sid,
                        DatasetId => $datasetId,
                        WantLogged => $wantLogged,
                        Format => $gddFormat,
                        OutputFile => $fmt_f,
                        Thumbnail => $thumbnail_b,
                        DefaultPlotPart => $default,
                        VisibleParts => \@visibleParts,
                        Compact => $compact,
                        IdType => $idType,
                        WidthOverride => $widthOverride,
                        HeightOverride => $heightOverride,
                        VisiblePartsAreFuzzy => $visiblePartsAreFuzzy,
                        Facets => \@facets,
                        ContXAxis => $contXAxis,
                        YAxis => \@yAxis,
                        EventStart => $eventStart,
                        EventDur => $eventDur,
                        Status => $status,
                        OptStatus => $optStatus,
                        SampleInfo => \@sampleInfo,
                        Xmin => $xminOverride,
                        Xmax => $xmaxOverride,
                        Project => $project,
                        CgiApp => $Cgi,
		        BaseUrl => $baseUrl,
                        Save => $save_b,
                       });
         };

	 if ($@) {
           die "Unable to load driver for '$type': $@";
	 }

         if($declareParts) {
			print $Cgi->header(-Content_type => "application/json");
           my $parts = $_gp->declareParts();
           print STDOUT encode_json($parts);
         }

        else {
         my @files = $_gp->run();

	 # output the result; expiration date set to disable caching for
	 # now.

	 if (!$quiet_b) {
                       my $outputFile = $_gp->getOutputFile();


			print $Cgi->header(-Content_type => $contentType{$format} . ';charset=utf-8',
                         -Cache_Control      => 'max-age=600',
                        );
                      
                      # THIS IS A TEMPORARY WORKAROUND
                      if($format eq 'html') {
                       system('sed -i \'s/DATA_PLOTTER/\/dataPlotter/\' ' .  $outputFile);
                       system('sed -i \'s/"padding":40/"padding":0/g\' ' . $outputFile);
			system "cat $outputFile";
                       }
                      else {
                        system "cat $outputFile";
                      }


	 }
       }
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;
